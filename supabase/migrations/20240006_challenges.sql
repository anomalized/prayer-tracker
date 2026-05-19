-- ─────────────────────────────────────────────────────────────────────────────
-- Prayer Challenges
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Challenges table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS challenges (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status         TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed', 'declined')),
  type           TEXT        NOT NULL DEFAULT 'seven_day_completion'
    CHECK (type IN ('seven_day_completion')),
  start_date     DATE,
  end_date       DATE,
  winner_id      UUID        REFERENCES auth.users(id),
  points_awarded BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A pair can only have one pending or active challenge at a time
  CONSTRAINT challenges_no_duplicate_active
    EXCLUDE USING btree (
      LEAST(challenger_id::text, opponent_id::text)    WITH =,
      GREATEST(challenger_id::text, opponent_id::text) WITH =
    ) WHERE (status IN ('pending', 'active'))
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS challenges_challenger_idx
  ON challenges (challenger_id, status);
CREATE INDEX IF NOT EXISTS challenges_opponent_idx
  ON challenges (opponent_id, status);
CREATE INDEX IF NOT EXISTS challenges_end_date_idx
  ON challenges (end_date) WHERE status = 'active';

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_select_participant"
  ON challenges FOR SELECT
  USING (auth.uid() IN (challenger_id, opponent_id));

CREATE POLICY "challenges_insert_challenger"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "challenges_update_participant"
  ON challenges FOR UPDATE
  USING (auth.uid() IN (challenger_id, opponent_id));

-- ── 2. get_challenge_results RPC ──────────────────────────────────────────────
-- Returns both participants' stats for a challenge.
-- Also handles auto-completion if end_date has passed.
-- Called by getChallengeLeaderboard server action.

CREATE OR REPLACE FUNCTION get_challenge_results(p_challenge_id UUID)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_challenge       challenges%ROWTYPE;
  v_challenger_pct  NUMERIC;
  v_opponent_pct    NUMERIC;
  v_challenger_done INTEGER;
  v_opponent_done   INTEGER;
  v_total_possible  INTEGER;
  v_winner_id       UUID;
  v_challenger_name TEXT;
  v_opponent_name   TEXT;
BEGIN
  -- Security: caller must be a participant
  SELECT * INTO v_challenge
  FROM challenges
  WHERE id = p_challenge_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF auth.uid() NOT IN (v_challenge.challenger_id, v_challenge.opponent_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'access_denied');
  END IF;

  SELECT full_name INTO v_challenger_name
  FROM profiles WHERE id = v_challenge.challenger_id;

  SELECT full_name INTO v_opponent_name
  FROM profiles WHERE id = v_challenge.opponent_id;

  IF v_challenge.status = 'pending' OR v_challenge.start_date IS NULL THEN
    RETURN jsonb_build_object(
      'ok',              true,
      'status',          v_challenge.status,
      'challengerName',  v_challenger_name,
      'opponentName',    v_opponent_name,
      'challengerPct',   0,
      'opponentPct',     0,
      'daysRemaining',   7
    );
  END IF;

  v_total_possible := 5 * (v_challenge.end_date - v_challenge.start_date + 1);

  SELECT COUNT(*) INTO v_challenger_done
  FROM prayers
  WHERE user_id    = v_challenge.challenger_id
    AND date      >= v_challenge.start_date
    AND date      <= LEAST(v_challenge.end_date, CURRENT_DATE)
    AND status    != 'missed';

  SELECT COUNT(*) INTO v_opponent_done
  FROM prayers
  WHERE user_id    = v_challenge.opponent_id
    AND date      >= v_challenge.start_date
    AND date      <= LEAST(v_challenge.end_date, CURRENT_DATE)
    AND status    != 'missed';

  v_challenger_pct := ROUND((v_challenger_done::NUMERIC / v_total_possible) * 100, 1);
  v_opponent_pct   := ROUND((v_opponent_done::NUMERIC   / v_total_possible) * 100, 1);

  IF v_challenge.end_date < CURRENT_DATE AND v_challenge.status = 'active' THEN

    IF v_challenger_done >= v_opponent_done THEN
      v_winner_id := v_challenge.challenger_id;
    ELSE
      v_winner_id := v_challenge.opponent_id;
    END IF;

    UPDATE challenges
    SET status        = 'completed',
        winner_id     = v_winner_id,
        points_awarded = TRUE
    WHERE id = p_challenge_id
      AND status = 'active';

    IF FOUND THEN
      UPDATE user_stats
      SET total_points = total_points + 50
      WHERE user_id = v_winner_id;

      UPDATE user_stats
      SET total_points = total_points + 20
      WHERE user_id = CASE
        WHEN v_winner_id = v_challenge.challenger_id
          THEN v_challenge.opponent_id
          ELSE v_challenge.challenger_id
        END;
    END IF;

    RETURN jsonb_build_object(
      'ok',             true,
      'status',         'completed',
      'challengerName', v_challenger_name,
      'opponentName',   v_opponent_name,
      'challengerPct',  v_challenger_pct,
      'opponentPct',    v_opponent_pct,
      'winnerId',       v_winner_id,
      'daysRemaining',  0,
      'pointsAwarded',  true
    );
  END IF;

  RETURN jsonb_build_object(
    'ok',             true,
    'status',         v_challenge.status,
    'challengerName', v_challenger_name,
    'opponentName',   v_opponent_name,
    'challengerPct',  v_challenger_pct,
    'opponentPct',    v_opponent_pct,
    'winnerId',       v_challenge.winner_id,
    'daysRemaining',  GREATEST(0, v_challenge.end_date - CURRENT_DATE + 1),
    'pointsAwarded',  v_challenge.points_awarded
  );
END;
$$;

REVOKE ALL   ON FUNCTION get_challenge_results(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_challenge_results(UUID) TO authenticated;

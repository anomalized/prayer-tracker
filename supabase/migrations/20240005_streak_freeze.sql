-- ─────────────────────────────────────────────────────────────────────────────
-- Streak Freeze & Events
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add freeze count to user_stats ────────────────────────────────────────
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS streak_freeze_count INTEGER NOT NULL DEFAULT 0
    CHECK (streak_freeze_count BETWEEN 0 AND 3);

-- ── 2. Streak events ledger ───────────────────────────────────────────────────
-- Immutable append-only log of every streak state transition.
-- Never UPDATE or DELETE rows here — it's a financial-ledger style audit trail.

CREATE TABLE IF NOT EXISTS streak_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type          TEXT        NOT NULL
    CHECK (event_type IN ('freeze_used', 'streak_reset', 'streak_extended', 'freeze_purchased')),
  date                DATE        NOT NULL DEFAULT CURRENT_DATE,
  streak_value_before INTEGER     NOT NULL DEFAULT 0 CHECK (streak_value_before >= 0),
  streak_value_after  INTEGER     NOT NULL DEFAULT 0 CHECK (streak_value_after  >= 0),
  freeze_count_before INTEGER               CHECK (freeze_count_before >= 0),
  freeze_count_after  INTEGER               CHECK (freeze_count_after >= 0),
  points_spent        INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS streak_events_user_id_idx
  ON streak_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS streak_events_user_date_idx
  ON streak_events (user_id, date DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE streak_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streak_events_select_own"
  ON streak_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "streak_events_insert_own"
  ON streak_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No UPDATE / DELETE policies — ledger is append-only.

-- ── 3. purchase_streak_freeze RPC ────────────────────────────────────────────
-- Atomic purchase using row-level locking.
-- Returns a result object so the caller can distinguish error types.

CREATE OR REPLACE FUNCTION purchase_streak_freeze(p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats          user_stats%ROWTYPE;
  v_cost           CONSTANT INTEGER := 100;
  v_max_freezes    CONSTANT INTEGER := 3;
BEGIN
  -- Security check
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'access_denied');
  END IF;

  -- Lock the row for the duration of the transaction
  SELECT * INTO v_stats
  FROM user_stats
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'stats_not_found');
  END IF;

  -- Guard: insufficient points
  IF v_stats.total_points < v_cost THEN
    RETURN jsonb_build_object(
      'ok',             false,
      'error',          'insufficient_points',
      'points_needed',  v_cost - v_stats.total_points
    );
  END IF;

  -- Guard: already at max
  IF v_stats.streak_freeze_count >= v_max_freezes THEN
    RETURN jsonb_build_object(
      'ok',    false,
      'error', 'max_freezes_reached'
    );
  END IF;

  -- Deduct points and increment freeze count
  UPDATE user_stats
  SET
    total_points        = total_points - v_cost,
    streak_freeze_count = streak_freeze_count + 1
  WHERE user_id = p_user_id;

  -- Write ledger event
  INSERT INTO streak_events (
    user_id,
    event_type,
    date,
    streak_value_before,
    streak_value_after,
    freeze_count_before,
    freeze_count_after,
    points_spent
  ) VALUES (
    p_user_id,
    'freeze_purchased',
    CURRENT_DATE,
    v_stats.current_streak,
    v_stats.current_streak,
    v_stats.streak_freeze_count,
    v_stats.streak_freeze_count + 1,
    v_cost
  );

  RETURN jsonb_build_object(
    'ok',                   true,
    'new_freeze_count',     v_stats.streak_freeze_count + 1,
    'new_points',           v_stats.total_points - v_cost
  );
END;
$$;

REVOKE ALL   ON FUNCTION purchase_streak_freeze(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION purchase_streak_freeze(UUID) TO authenticated;

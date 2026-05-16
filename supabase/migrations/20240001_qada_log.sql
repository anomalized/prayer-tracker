-- ─────────────────────────────────────────────────────────────────────────────
-- Qada (makeup prayer) tracker
-- One row per user per prayer_name — upserted, never duplicated.
-- made_up_count  : running total of makeups logged (never decrements)
-- remaining_count: user-set debt they are working through (can be adjusted)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS qada_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_name      TEXT        NOT NULL CHECK (prayer_name IN ('Fajr','Dhuhr','Asr','Maghrib','Isha')),
  made_up_count    INTEGER     NOT NULL DEFAULT 0 CHECK (made_up_count >= 0),
  remaining_count  INTEGER     NOT NULL DEFAULT 0 CHECK (remaining_count >= 0),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per user per prayer — upsert target
  CONSTRAINT qada_log_user_prayer_unique UNIQUE (user_id, prayer_name)
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS qada_log_user_id_idx ON qada_log (user_id);

-- ── Auto-update updated_at ─────────────────────────────────────────────────── 
CREATE OR REPLACE FUNCTION update_qada_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER qada_log_updated_at
  BEFORE UPDATE ON qada_log
  FOR EACH ROW EXECUTE FUNCTION update_qada_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE qada_log ENABLE ROW LEVEL SECURITY;

-- Users can only read their own rows
CREATE POLICY "qada_select_own"
  ON qada_log FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own rows
CREATE POLICY "qada_insert_own"
  ON qada_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own rows
CREATE POLICY "qada_update_own"
  ON qada_log FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy — qada records are append-only for data integrity.
-- Remaining count going to 0 signals completion; hard deletes are not needed.

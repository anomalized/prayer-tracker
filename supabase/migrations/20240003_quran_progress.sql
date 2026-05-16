-- ─────────────────────────────────────────────────────────────────────────────
-- Quran reading progress + bookmarks
--
-- One row per (user, surah). Upserted on every interaction.
-- bookmarked_ayahs uses a native int array — fast contains checks,
-- no join table needed for this cardinality (max 286 ayahs per surah).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quran_progress (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_number      INTEGER     NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  last_ayah         INTEGER     NOT NULL DEFAULT 1 CHECK (last_ayah >= 1),
  bookmarked_ayahs  INTEGER[]   NOT NULL DEFAULT '{}',
  last_read_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT quran_progress_user_surah_unique UNIQUE (user_id, surah_number)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Primary lookup: all surahs for a user (library page, last-read banner)
CREATE INDEX IF NOT EXISTS quran_progress_user_id_idx
  ON quran_progress (user_id);

-- Single-surah lookup (reader open)
CREATE INDEX IF NOT EXISTS quran_progress_user_surah_idx
  ON quran_progress (user_id, surah_number);

-- GIN index on the array column — makes `bookmarked_ayahs @> ARRAY[n]`
-- efficient if you ever query "all surahs where ayah N is bookmarked"
CREATE INDEX IF NOT EXISTS quran_progress_bookmarks_gin_idx
  ON quran_progress USING GIN (bookmarked_ayahs);

-- ── Auto-update last_read_at ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_quran_progress_last_read_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.last_read_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER quran_progress_last_read_at_trigger
  BEFORE UPDATE ON quran_progress
  FOR EACH ROW EXECUTE FUNCTION update_quran_progress_last_read_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE quran_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quran_progress_select_own"
  ON quran_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "quran_progress_insert_own"
  ON quran_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quran_progress_update_own"
  ON quran_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy — users clear via setBookmarks([]) and setLastAyah(1),
-- not by deleting rows. Preserves the last_read_at history.

-- ── append_quran_bookmark RPC ───────────────────────────────────────────────
-- Appends an ayah number to bookmarked_ayahs only if not already present.
-- Runs atomically inside Postgres — no read-modify-write race from the client.

CREATE OR REPLACE FUNCTION append_quran_bookmark(
  p_user_id      UUID,
  p_surah_number INTEGER,
  p_ayah_number  INTEGER
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE quran_progress
  SET bookmarked_ayahs = array_append(bookmarked_ayahs, p_ayah_number)
  WHERE user_id      = p_user_id
    AND surah_number = p_surah_number
    AND NOT (bookmarked_ayahs @> ARRAY[p_ayah_number]);
END;
$$;

REVOKE ALL ON FUNCTION append_quran_bookmark FROM PUBLIC;
GRANT EXECUTE ON FUNCTION append_quran_bookmark TO authenticated;

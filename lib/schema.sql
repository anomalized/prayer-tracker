-- ============================================================
-- PRAYER TRACKER — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- ─── Profiles ───────────────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  avatar_url  TEXT,
  city        TEXT DEFAULT 'Islamabad',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Prayer Logs ────────────────────────────────────────────
CREATE TABLE prayers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prayer_name  TEXT NOT NULL CHECK (prayer_name IN ('Fajr','Dhuhr','Asr','Maghrib','Isha')),
  date         DATE NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('ontime','late','missed')),
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, prayer_name, date)
);

-- ─── User Stats ─────────────────────────────────────────────
CREATE TABLE user_stats (
  user_id          UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_points     INT DEFAULT 0,
  current_streak   INT DEFAULT 0,
  best_streak      INT DEFAULT 0,
  last_active_date DATE,
  onboarding_complete BOOLEAN DEFAULT FALSE
);

-- ─── Badges ─────────────────────────────────────────────────
CREATE TABLE user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL,
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

-- ─── Friendships ────────────────────────────────────────────
CREATE TABLE friendships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges  ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships  ENABLE ROW LEVEL SECURITY;

-- Profiles: read own + accepted friends, write own only
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = id) OR
        (addressee_id = auth.uid() AND requester_id = id)
      )
    )
  );

CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- Prayers: read own + accepted friends, write own only
CREATE POLICY "prayers_select" ON prayers FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = prayers.user_id) OR
        (addressee_id = auth.uid() AND requester_id = prayers.user_id)
      )
    )
  );

CREATE POLICY "prayers_insert" ON prayers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "prayers_update" ON prayers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "prayers_delete" ON prayers FOR DELETE USING (user_id = auth.uid());

-- User stats: same as prayers
CREATE POLICY "stats_select" ON user_stats FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = user_stats.user_id) OR
        (addressee_id = auth.uid() AND requester_id = user_stats.user_id)
      )
    )
  );

CREATE POLICY "stats_insert" ON user_stats FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "stats_update" ON user_stats FOR UPDATE USING (user_id = auth.uid());

-- Badges: read own + friends, write own
CREATE POLICY "badges_select" ON user_badges FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = user_badges.user_id) OR
        (addressee_id = auth.uid() AND requester_id = user_badges.user_id)
      )
    )
  );

CREATE POLICY "badges_insert" ON user_badges FOR INSERT WITH CHECK (user_id = auth.uid());

-- Friendships: see own requests only
CREATE POLICY "friendships_select" ON friendships FOR SELECT
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "friendships_insert" ON friendships FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "friendships_update" ON friendships FOR UPDATE
  USING (addressee_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- Notification preferences + token storage
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add notifications_enabled to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Notification tokens table
--    Stores the OneSignal subscription ID per user.
--    Replaces any ad-hoc storage the existing saveNotificationToken used.
CREATE TABLE IF NOT EXISTS notification_tokens (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token         TEXT        NOT NULL,
  platform      TEXT        NOT NULL DEFAULT 'web',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT notification_tokens_user_platform_unique UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS notification_tokens_user_id_idx
  ON notification_tokens (user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_notification_token_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE OR REPLACE TRIGGER notification_tokens_updated_at
  BEFORE UPDATE ON notification_tokens
  FOR EACH ROW EXECUTE FUNCTION update_notification_token_updated_at();

-- RLS
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_tokens_select_own"
  ON notification_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_tokens_insert_own"
  ON notification_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_tokens_update_own"
  ON notification_tokens FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Schedule log — prevents double-scheduling across tabs/devices
CREATE TABLE IF NOT EXISTS notification_schedule_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date  DATE        NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prayer_count    INTEGER     NOT NULL DEFAULT 0,

  CONSTRAINT notification_schedule_log_user_date_unique UNIQUE (user_id, scheduled_date)
);

ALTER TABLE notification_schedule_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_log_select_own"
  ON notification_schedule_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "schedule_log_insert_own"
  ON notification_schedule_log FOR INSERT WITH CHECK (auth.uid() = user_id);

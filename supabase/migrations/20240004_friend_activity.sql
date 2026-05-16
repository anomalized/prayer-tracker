-- ─────────────────────────────────────────────────────────────────────────────
-- Friend activity feed function
-- Returns the latest activity from accepted friends: prayer logs, qada updates,
-- and badge earnings.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE IF NOT EXISTS friend_activity_type AS ENUM ('prayer', 'qada', 'badge');

CREATE FUNCTION get_friend_activity(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  friend_id UUID,
  friend_name TEXT,
  activity_type friend_activity_type,
  title TEXT,
  subtitle TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET row_security = off
AS $$
  SELECT
    p.id,
    p.user_id,
    pr.full_name,
    'prayer'::friend_activity_type,
    CONCAT('Logged ', p.prayer_name, ' prayer'),
    CONCAT('Status: ', p.status, ' · ', to_char(p.date, 'Mon DD')),
    jsonb_build_object(
      'prayer_name', p.prayer_name,
      'status', p.status,
      'date', p.date
    ),
    p.created_at
  FROM prayers p
  JOIN profiles pr ON pr.id = p.user_id
  WHERE EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.requester_id = auth.uid() AND f.addressee_id = p.user_id) OR
        (f.addressee_id = auth.uid() AND f.requester_id = p.user_id)
      )
  )

  UNION ALL

  SELECT
    q.id,
    q.user_id,
    pr.full_name,
    'qada'::friend_activity_type,
    CONCAT('Updated qada for ', q.prayer_name),
    CONCAT('Made up ', q.made_up_count, ', debt ', q.remaining_count),
    jsonb_build_object(
      'prayer_name', q.prayer_name,
      'made_up_count', q.made_up_count,
      'remaining_count', q.remaining_count
    ),
    q.updated_at
  FROM qada_log q
  JOIN profiles pr ON pr.id = q.user_id
  WHERE EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.requester_id = auth.uid() AND f.addressee_id = q.user_id) OR
        (f.addressee_id = auth.uid() AND f.requester_id = q.user_id)
      )
  )

  UNION ALL

  SELECT
    b.id,
    b.user_id,
    pr.full_name,
    'badge'::friend_activity_type,
    CONCAT('Earned badge ', b.badge_id),
    to_char(b.earned_at, 'Mon DD, YYYY'),
    jsonb_build_object('badge_id', b.badge_id),
    b.earned_at
  FROM user_badges b
  JOIN profiles pr ON pr.id = b.user_id
  WHERE EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.requester_id = auth.uid() AND f.addressee_id = b.user_id) OR
        (f.addressee_id = auth.uid() AND f.requester_id = b.user_id)
      )
  )

  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION get_friend_activity(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_friend_activity(INTEGER) TO authenticated;

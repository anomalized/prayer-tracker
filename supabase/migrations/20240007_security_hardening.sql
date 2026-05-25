-- Security hardening for RPCs and challenge updates.

CREATE OR REPLACE FUNCTION append_quran_bookmark(
  p_user_id      UUID,
  p_surah_number INTEGER,
  p_ayah_number  INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'access_denied' USING ERRCODE = '42501';
  END IF;

  IF p_surah_number NOT BETWEEN 1 AND 114 OR p_ayah_number < 1 THEN
    RAISE EXCEPTION 'invalid_quran_progress_input' USING ERRCODE = '22023';
  END IF;

  UPDATE quran_progress
  SET bookmarked_ayahs = array_append(bookmarked_ayahs, p_ayah_number)
  WHERE user_id      = p_user_id
    AND surah_number = p_surah_number
    AND NOT (bookmarked_ayahs @> ARRAY[p_ayah_number]);
END;
$$;

REVOKE ALL ON FUNCTION append_quran_bookmark(UUID, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION append_quran_bookmark(UUID, INTEGER, INTEGER) TO authenticated;

ALTER FUNCTION get_friend_activity(INTEGER) SET search_path = public, pg_temp;
ALTER FUNCTION get_challenge_results(UUID) SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION accept_challenge(p_challenge_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_updated_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'access_denied');
  END IF;

  UPDATE challenges
  SET status = 'active',
      start_date = CURRENT_DATE,
      end_date = CURRENT_DATE + 6
  WHERE id = p_challenge_id
    AND opponent_id = v_user_id
    AND status = 'pending'
    AND winner_id IS NULL
    AND points_awarded = FALSE
  RETURNING id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION decline_challenge(p_challenge_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_updated_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'access_denied');
  END IF;

  UPDATE challenges
  SET status = 'declined'
  WHERE id = p_challenge_id
    AND opponent_id = v_user_id
    AND status = 'pending'
    AND winner_id IS NULL
    AND points_awarded = FALSE
  RETURNING id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION accept_challenge(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION decline_challenge(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accept_challenge(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_challenge(UUID) TO authenticated;

DROP POLICY IF EXISTS "challenges_update_participant" ON challenges;

CREATE POLICY "challenges_no_direct_update"
  ON challenges FOR UPDATE
  USING (FALSE)
  WITH CHECK (FALSE);

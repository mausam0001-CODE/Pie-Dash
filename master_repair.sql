-- =============================================================
-- MASTER DATABASE REPAIR: SOCIAL PUBLISHING ENGINE
-- Ensures required columns exist for error tracking and state.
-- =============================================================

-- 1. ADD ERROR TRACKING TO POSTS
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS permalink text;

-- 2. ENABLE REALTIME FOR POSTS
-- This ensures the "Published" notification pops up instantly.
ALTER TABLE public.posts REPLICA IDENTITY FULL;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'posts'
  ) THEN
    PERFORM (
      SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    );
    IF FOUND THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    END IF;
  END IF;
END $$;

-- 3. ENSURE PERMISSIONS
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

COMMENT ON COLUMN public.posts.error_message IS 'Stores the last failure message from social platform APIs.';

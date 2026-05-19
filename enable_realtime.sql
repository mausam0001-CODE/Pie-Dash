-- ENABLE REAL-TIME FOR PIE SOCIAL TABLES
-- Run this in your Supabase SQL Editor to enable real-time updates for the dashboard.

-- 1. Enable replication for the 'posts' table
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- 2. Enable replication for the 'social_accounts' table
ALTER TABLE public.social_accounts REPLICA IDENTITY FULL;

-- 3. Add tables to the 'supabase_realtime' publication
-- Note: If these table are already in the publication, this will simply ensure they are included.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'social_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_accounts;
  END IF;
END $$;

-- 4. Reload PostgREST schema (optional but recommended)
NOTIFY pgrst, 'reload schema';

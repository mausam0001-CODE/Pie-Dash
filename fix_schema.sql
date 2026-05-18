-- =============================================================
-- SOCIAL DASHBOARD SCHEMA FIX
-- Run this in your Supabase SQL Editor to add missing columns.
-- =============================================================

-- 1. FIX SOCIAL ACCOUNTS TABLE
ALTER TABLE public.social_accounts 
  ADD COLUMN IF NOT EXISTS account_id text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. FIX POSTS TABLE
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS social_account_id uuid REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS like_count int8 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count int8 DEFAULT 0;

-- 3. ADD UNIQUE CONSTRAINT FOR UPSERT
-- This prevents duplicate posts from being created during sync.
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_account_external_unique;
ALTER TABLE public.posts ADD CONSTRAINT posts_account_external_unique UNIQUE (social_account_id, external_id);

-- 4. CREATE ACCOUNT METRICS TABLE
CREATE TABLE IF NOT EXISTS public.account_metrics (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id uuid REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_count    int8 DEFAULT 0,
  month             date NOT NULL DEFAULT CURRENT_DATE,
  created_at        timestamptz DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE public.account_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own metrics" ON public.account_metrics;
CREATE POLICY "Users can view their own metrics" ON public.account_metrics 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own metrics" ON public.account_metrics;
CREATE POLICY "Users can insert their own metrics" ON public.account_metrics 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. RE-RE-FIX POSTS CONSTRAINT (PLATFORMS AS JSONB)
-- Some versions of the schema had platforms as 'text', but our code needs 'jsonb'.
ALTER TABLE public.posts ALTER COLUMN platforms TYPE jsonb USING 
  CASE 
    WHEN platforms IS NULL THEN '[]'::jsonb 
    WHEN platforms = '' THEN '[]'::jsonb 
    ELSE jsonb_build_array(platforms) 
  END;

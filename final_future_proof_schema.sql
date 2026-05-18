-- =============================================================
-- THE ULTIMATE FUTURE-PROOF SCHEMA FIX
-- Supports Instagram, TikTok, YouTube, and X.
-- Run this in your Supabase SQL Editor.
-- =============================================================

-- 1. UPGRADE SOCIAL ACCOUNTS
ALTER TABLE public.social_accounts 
  ADD COLUMN IF NOT EXISTS account_id text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS follower_count int8 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_business boolean DEFAULT false;

-- 2. UPGRADE POSTS
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS social_account_id uuid REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS permalink text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS view_count int8 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count int8 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count int8 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count int8 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS save_count int8 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_count int8 DEFAULT 0, -- TikTok specific
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'Uncategorized';

-- Ensure platforms column is JSONB (modern standard)
ALTER TABLE public.posts ALTER COLUMN platforms TYPE jsonb USING 
  CASE 
    WHEN platforms IS NULL THEN '[]'::jsonb 
    WHEN platforms::text = '' THEN '[]'::jsonb 
    ELSE jsonb_build_array(platforms) 
  END;

-- Ensure unique constraint for sync
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_account_external_unique;
ALTER TABLE public.posts ADD CONSTRAINT posts_account_external_unique UNIQUE (social_account_id, external_id);

-- 3. UPGRADE ACCOUNT METRICS
CREATE TABLE IF NOT EXISTS public.account_metrics (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id uuid REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_count    int8 DEFAULT 0,
  subscriber_count  int8 DEFAULT 0, -- YouTube specific
  view_count        int8 DEFAULT 0, -- Total channel views
  engagement_rate   float8 DEFAULT 0,
  month             date NOT NULL DEFAULT CURRENT_DATE,
  created_at        timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own metrics" ON public.account_metrics;
CREATE POLICY "Users can view their own metrics" ON public.account_metrics 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own metrics" ON public.account_metrics;
CREATE POLICY "Users can insert their own metrics" ON public.account_metrics 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. VIEWS FOR AGGREGATED ANALYTICS (Optional but helpful)
-- This makes the Analytics page faster by pre-calculating totals
CREATE OR REPLACE VIEW public.vw_user_analytics AS
SELECT 
  p.user_id,
  COUNT(p.id) as total_posts,
  SUM(p.view_count) as total_views,
  SUM(p.like_count) as total_likes,
  AVG(CASE WHEN p.view_count > 0 THEN (p.like_count + p.comments_count)::float / p.view_count ELSE 0 END) as avg_engagement
FROM public.posts p
GROUP BY p.user_id;

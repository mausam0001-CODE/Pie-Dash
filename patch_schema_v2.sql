-- =============================================================
-- SCHEMA PATCH #2: ADDING VIEWS AND SHARES
-- Run this in your Supabase SQL Editor.
-- =============================================================

ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS view_count int8 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count int8 DEFAULT 0;

-- Optional: If you want to track more detailed engagement
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS save_count int8 DEFAULT 0;

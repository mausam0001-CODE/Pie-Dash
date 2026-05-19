-- FIX: Missing Columns in 'posts' table
-- Run this in your Supabase SQL Editor to resolve the 'media_type' error.

ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'IMAGE',
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'Public',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'Uncategorized',
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS permalink text,
  ADD COLUMN IF NOT EXISTS share_count int8 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count int8 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count int8 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count int8 DEFAULT 0;

-- Ensure the schema is refreshed for PostgREST
NOTIFY pgrst, 'reload schema';

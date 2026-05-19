-- FIX: Support Drafts without scheduled date
-- Run this in your Supabase SQL Editor to allow saving drafts.

ALTER TABLE public.posts 
  ALTER COLUMN scheduled_at DROP NOT NULL;

-- Ensure the schema is refreshed for PostgREST
NOTIFY pgrst, 'reload schema';

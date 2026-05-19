-- =============================================================
-- SCHEMA UPDATE: ADD PROCESSING STATUS
-- Adds 'Processing' to the allowed status values for posts.
-- =============================================================

-- 1. Drop existing constraint
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;

-- 2. Add updated constraint including 'Processing'
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check
  CHECK (status IN ('Draft', 'Scheduled', 'Published', 'Failed', 'Processing'));

COMMENT ON COLUMN public.posts.status IS 'Status of the post: Draft, Scheduled, Published, Failed, or Processing (currently being dispatched).';

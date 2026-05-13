-- Update posts table to support external IDs and deduplication
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Create a unique index for deduplication during sync
-- We use a combination of social_account_id and external_id (the Meta ID)
DROP INDEX IF EXISTS idx_posts_social_external;
CREATE UNIQUE INDEX idx_posts_social_external ON public.posts(social_account_id, external_id);

-- Also add external_id to existing rows if possible (will be null for old ones)

-- =============================================================
-- Pie Pro Social Dashboard — Supabase Schema Migration
-- SAFE TO RUN on existing databases — uses IF NOT EXISTS guards.
-- Run this in Supabase SQL Editor.
-- Last updated: April 2026 — Emerald Bento Edition
-- =============================================================


-- =============================================================
-- STEP 1: EXTENSIONS
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================
-- STEP 2: POSTS TABLE — create fresh or patch existing
-- =============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text,
  caption         text,
  media_url       text,
  platforms       text          NOT NULL DEFAULT '',
  scheduled_at    timestamptz,
  status          text          NOT NULL DEFAULT 'Draft',
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- Patch: add columns that may not exist on older installs
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS error_message   text,
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();

-- Patch: tighten the status constraint
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check
  CHECK (status IN ('Draft', 'Scheduled', 'Published', 'Failed'));

COMMENT ON TABLE  public.posts IS 'All social media posts in every lifecycle state.';
COMMENT ON COLUMN public.posts.error_message IS 'Populated by the background worker on API dispatch failure.';


-- =============================================================
-- STEP 3: SOCIAL ACCOUNTS TABLE — create fresh or patch existing
-- =============================================================
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  platform        text          NOT NULL,
  username        text          NOT NULL,
  access_token    text          NOT NULL,
  refresh_token   text,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- Patch: add columns that may not exist on older installs
ALTER TABLE public.social_accounts
  ADD COLUMN IF NOT EXISTS user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz NOT NULL DEFAULT now();

-- Patch: platform constraint
ALTER TABLE public.social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;
ALTER TABLE public.social_accounts ADD CONSTRAINT social_accounts_platform_check
  CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'x'));

COMMENT ON TABLE  public.social_accounts IS 'OAuth token pairs for connected social platforms. Never store raw API keys.';
COMMENT ON COLUMN public.social_accounts.token_expires_at IS 'Worker refreshes token automatically if expiry < 7 days.';


-- =============================================================
-- STEP 4: AUTO-UPDATE updated_at TRIGGER
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_posts_updated_at ON public.posts;
CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_social_accounts_updated_at ON public.social_accounts;
CREATE TRIGGER set_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =============================================================
-- STEP 5: INDEXES
-- =============================================================

-- Worker: find Scheduled posts due for dispatch
CREATE INDEX IF NOT EXISTS idx_posts_worker
  ON public.posts (status, scheduled_at ASC)
  WHERE status = 'Scheduled';

-- Dashboard: user's posts newest-first
CREATE INDEX IF NOT EXISTS idx_posts_user_dashboard
  ON public.posts (user_id, created_at DESC);

-- Connections: fast lookup by user + platform
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform
  ON public.social_accounts (user_id, platform);


-- =============================================================
-- STEP 6: ROW LEVEL SECURITY
-- Frontend (anon key) → RLS enforced.
-- Worker (service-role key) → RLS bypassed automatically.
-- =============================================================
ALTER TABLE public.posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- Posts policies
DROP POLICY IF EXISTS "Users can view their own posts"   ON public.posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Users can view their own posts"   ON public.posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Social accounts policies
DROP POLICY IF EXISTS "Users can view their own accounts"   ON public.social_accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.social_accounts;

CREATE POLICY "Users can view their own accounts"   ON public.social_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own accounts" ON public.social_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own accounts" ON public.social_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own accounts" ON public.social_accounts FOR DELETE USING (auth.uid() = user_id);


-- =============================================================
-- DONE ✅ — All changes are idempotent, safe to re-run anytime.
-- Next: npx supabase gen types typescript --project-id YOUR_ID > src/lib/database.types.ts
-- =============================================================




-- =============================================================
-- STEP 2: POSTS TABLE
-- The central table. Stores all posts in every lifecycle state.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text          NOT NULL,
  caption         text,
  media_url       text,
  platforms       jsonb         NOT NULL DEFAULT '[]',  -- e.g. ["instagram","tiktok"]
  scheduled_at    timestamptz,
  status          text          NOT NULL DEFAULT 'Draft'
                                CHECK (status IN ('Draft', 'Scheduled', 'Published', 'Failed')),
  error_message   text,         -- populated by worker on dispatch failure
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.posts IS 'Stores all social media posts in all lifecycle states.';
COMMENT ON COLUMN public.posts.platforms IS 'JSONB array of platform strings, e.g. ["instagram","tiktok","youtube","x"]';
COMMENT ON COLUMN public.posts.error_message IS 'Populated by the background worker when API dispatch fails.';


-- =============================================================
-- STEP 3: SOCIAL ACCOUNTS TABLE
-- Stores per-user, per-platform OAuth token pairs.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          REFERENCES auth.users(id) ON DELETE CASCADE,
  platform        text          NOT NULL
                                CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'x')),
  username        text          NOT NULL,
  access_token    text          NOT NULL,
  refresh_token   text,
  token_expires_at timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)   -- One account per platform per user
);

COMMENT ON TABLE public.social_accounts IS 'OAuth token storage for connected social platforms. Never store raw API keys here.';
COMMENT ON COLUMN public.social_accounts.token_expires_at IS 'Worker refreshes token if expiry < 7 days from now.';


-- =============================================================
-- STEP 4: AUTO-UPDATE updated_at TRIGGER
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to posts
DROP TRIGGER IF EXISTS set_posts_updated_at ON public.posts;
CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Apply to social_accounts
DROP TRIGGER IF EXISTS set_social_accounts_updated_at ON public.social_accounts;
CREATE TRIGGER set_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =============================================================
-- STEP 5: INDEXES
-- =============================================================

-- Worker query: find all Scheduled posts with a due scheduled_at
CREATE INDEX IF NOT EXISTS idx_posts_worker
  ON public.posts (status, scheduled_at ASC)
  WHERE status = 'Scheduled';

-- Dashboard query: show a user's posts newest-first
CREATE INDEX IF NOT EXISTS idx_posts_user_dashboard
  ON public.posts (user_id, created_at DESC);

-- Social accounts: fast lookup by user + platform
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform
  ON public.social_accounts (user_id, platform);


-- =============================================================
-- STEP 6: ROW LEVEL SECURITY (RLS)
-- Frontend uses anon key → RLS enforced.
-- Worker uses service-role key → RLS bypassed automatically.
-- =============================================================

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- POSTS policies
CREATE POLICY "Users can view their own posts"
  ON public.posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- SOCIAL ACCOUNTS policies
CREATE POLICY "Users can view their own accounts"
  ON public.social_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
  ON public.social_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON public.social_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON public.social_accounts FOR DELETE
  USING (auth.uid() = user_id);


-- =============================================================
-- DONE ✅
-- Run: npx supabase gen types typescript --project-id YOUR_ID > src/lib/database.types.ts
-- =============================================================

-- =============================================================
-- USER SETTINGS SCHEMA FIX
-- Use this to fix the "settings column not found" error.
-- =============================================================

-- 1. Create user_settings table if not exists with correct column
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings          jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at        timestamptz DEFAULT now()
);

-- 2. Add 'settings' column if table exists but column is missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_settings' AND column_name='settings') THEN
        ALTER TABLE public.user_settings ADD COLUMN settings jsonb NOT NULL DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 4. Set up Policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" 
  ON public.user_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert their own settings" ON public.user_settings;
CREATE POLICY "Users can upsert their own settings" 
  ON public.user_settings 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- 5. Grant permissions
GRANT ALL ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;

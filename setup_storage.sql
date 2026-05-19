-- =============================================================
-- STORAGE SETUP: TEMP REELS BUCKET
-- Creating a public bucket for Meta to fetch video files.
-- =============================================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-reels', 'temp-reels', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access (Read)
CREATE POLICY "Public Read temp-reels" ON storage.objects
  FOR SELECT USING (bucket_id = 'temp-reels');

-- 3. Allow authenticated uploads
CREATE POLICY "Authenticated Upload temp-reels" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'temp-reels' 
    AND auth.role() = 'authenticated'
  );

-- 4. Allow service role management
CREATE POLICY "Service Role Management temp-reels" ON storage.objects
  FOR ALL TO service_role USING (bucket_id = 'temp-reels');

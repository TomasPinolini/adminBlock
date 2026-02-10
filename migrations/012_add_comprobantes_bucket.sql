-- Create the comprobantes storage bucket for PDF attachments
-- Run this in the Supabase SQL editor or via CLI

INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read comprobantes" ON storage.objects
  FOR SELECT USING (bucket_id = 'comprobantes');

-- Allow authenticated users to upload
CREATE POLICY "Auth upload comprobantes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'comprobantes');

-- Allow authenticated users to delete
CREATE POLICY "Auth delete comprobantes" ON storage.objects
  FOR DELETE USING (bucket_id = 'comprobantes');

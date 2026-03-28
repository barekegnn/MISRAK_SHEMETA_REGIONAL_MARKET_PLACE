-- Product images bucket (Requirement 4) — public read; uploads via service role in app

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "products_public_read" ON storage.objects;
CREATE POLICY "products_public_read" ON storage.objects FOR SELECT
USING (bucket_id = 'products');

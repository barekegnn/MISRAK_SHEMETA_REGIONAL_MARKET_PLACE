-- Extend shop_city enum for existing databases that ran an older 001_schema.
ALTER TYPE public.shop_city ADD VALUE IF NOT EXISTS 'Haramaya';
ALTER TYPE public.shop_city ADD VALUE IF NOT EXISTS 'Jijiga';

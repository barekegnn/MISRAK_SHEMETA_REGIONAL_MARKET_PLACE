-- Extend shop_city for Aweday and Jigjiga regional marketplace hubs
ALTER TYPE public.shop_city ADD VALUE IF NOT EXISTS 'Aweday';
ALTER TYPE public.shop_city ADD VALUE IF NOT EXISTS 'Jigjiga';

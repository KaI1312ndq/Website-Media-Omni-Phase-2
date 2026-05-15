-- Migration 09 — Product Master TikTok (Brief V12)
-- Riêng với Shopee vì Product ID khác hoàn toàn (TikTok 19 chữ số, dùng text để tránh BIGINT overflow).
-- Apply qua Supabase Dashboard → SQL editor.

CREATE TABLE IF NOT EXISTS product_master_tiktok (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name      text NOT NULL,
  product_id      text NOT NULL,
  ten_tiktok      text,
  ten_define      text,
  category        text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  updated_by      text,
  UNIQUE (brand_name, product_id)
);

CREATE INDEX IF NOT EXISTS idx_pm_tiktok_brand
  ON product_master_tiktok (brand_name);

CREATE INDEX IF NOT EXISTS idx_pm_tiktok_define
  ON product_master_tiktok (brand_name, ten_define);

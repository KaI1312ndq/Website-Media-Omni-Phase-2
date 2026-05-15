-- Migration 07 — Product Master (Brief V11)
-- Mapping table: Mã Sản phẩm Shopee → Tên define (per brand) cho drilldown.
-- Apply qua Supabase Dashboard → SQL editor.

CREATE TABLE IF NOT EXISTS product_master (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name      text NOT NULL,
  ma_san_pham     text NOT NULL,
  ten_shopee      text,
  ten_define      text,
  sku_code        text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  updated_by      text,
  UNIQUE (brand_name, ma_san_pham)
);

CREATE INDEX IF NOT EXISTS idx_product_master_brand
  ON product_master (brand_name);

CREATE INDEX IF NOT EXISTS idx_product_master_define
  ON product_master (brand_name, ten_define);

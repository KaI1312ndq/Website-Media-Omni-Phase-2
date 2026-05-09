-- ═══════════════════════════════════════════
-- MEDIA OMNI — Migration 01
-- Chạy trong Supabase SQL Editor
-- Cập nhật weekly_reports sang cấu trúc JSONB linh hoạt hơn
-- ═══════════════════════════════════════════

-- 1. Cho phép brand_name nullable (trước đây NOT NULL)
ALTER TABLE public.weekly_reports
  ALTER COLUMN brand_name DROP NOT NULL;

-- 2. Thêm các cột mới cho report page hiện tại
ALTER TABLE public.weekly_reports
  ADD COLUMN IF NOT EXISTS store        text,
  ADD COLUMN IF NOT EXISTS platform     text,
  ADD COLUMN IF NOT EXISTS week_label   text,
  ADD COLUMN IF NOT EXISTS week_start_txt text,
  ADD COLUMN IF NOT EXISTS week_end_txt   text,
  ADD COLUMN IF NOT EXISTS shopee_data  jsonb default '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tiktok_data  jsonb default '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_analysis  text;

-- 3. Xoá unique constraint cũ (vì brand_name có thể null)
ALTER TABLE public.weekly_reports
  DROP CONSTRAINT IF EXISTS weekly_reports_username_brand_name_year_month_week_num_key;

-- Xong — weekly_reports giờ tương thích với /hub/report

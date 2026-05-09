-- ═══════════════════════════════════════════
-- MEDIA OMNI — Migration 02
-- Thêm bảng monthly_plans (brand-based plan)
-- Chạy trong Supabase SQL Editor
-- ═══════════════════════════════════════════

create table if not exists public.monthly_plans (
  id uuid default gen_random_uuid() primary key,
  brand_name text not null,
  platform text not null, -- 'shopee' | 'tiktok'
  month int not null,
  year int not null,
  plan_data jsonb default '{}'::jsonb, -- { metric_key: { w1, w2, w3, w4, mtd, month } }
  created_by text,
  updated_at timestamptz default now(),
  unique(brand_name, platform, month, year)
);

alter table public.monthly_plans disable row level security;

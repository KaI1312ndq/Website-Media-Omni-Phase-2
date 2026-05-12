-- ════════════════════════════════════════════════════════════
-- Migration 04 — Brand context (for AI report prompt injection)
-- All columns nullable; richer context → richer AI analysis.
-- Run once, safe to re-run (uses IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════

alter table public.brands add column if not exists industry         text;
alter table public.brands add column if not exists product_type     text;
alter table public.brands add column if not exists target_audience  text;
alter table public.brands add column if not exists price_range      text;  -- 'Premium' | 'Mid' | 'Mass'
alter table public.brands add column if not exists brand_stage      text;  -- 'New' | 'Growing' | 'Mature'
alter table public.brands add column if not exists monthly_budget   text;
alter table public.brands add column if not exists roas_target      text;
alter table public.brands add column if not exists seasonality      text;
alter table public.brands add column if not exists live_schedule    text;
alter table public.brands add column if not exists key_kpis         text;
alter table public.brands add column if not exists notes            text;

alter table public.brands add column if not exists updated_by       text;
alter table public.brands add column if not exists updated_at       timestamptz default now();

create index if not exists brands_industry on public.brands(industry);

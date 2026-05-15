-- ════════════════════════════════════════════════════════════
-- Migration 05 — Refactor AI output from free-text to matrix
-- Per Brief V10 §3.2. 28 new columns (7 hạng mục × 4 cells).
-- All columns nullable; existing rows keep legacy nhan_xet_* fields.
-- Run once, safe to re-run (IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════

-- Shopee — 3 hạng mục
alter table public.weekly_reports add column if not exists s_cpc_plan       text;
alter table public.weekly_reports add column if not exists s_cpc_actual     text;
alter table public.weekly_reports add column if not exists s_cpc_danh_gia   text;
alter table public.weekly_reports add column if not exists s_cpc_giai_phap  text;

alter table public.weekly_reports add column if not exists s_nd_plan        text;
alter table public.weekly_reports add column if not exists s_nd_actual      text;
alter table public.weekly_reports add column if not exists s_nd_danh_gia    text;
alter table public.weekly_reports add column if not exists s_nd_giai_phap   text;

alter table public.weekly_reports add column if not exists s_live_plan      text;
alter table public.weekly_reports add column if not exists s_live_actual    text;
alter table public.weekly_reports add column if not exists s_live_danh_gia  text;
alter table public.weekly_reports add column if not exists s_live_giai_phap text;

-- TikTok — 4 hạng mục
alter table public.weekly_reports add column if not exists t_pgm_plan        text;
alter table public.weekly_reports add column if not exists t_pgm_actual      text;
alter table public.weekly_reports add column if not exists t_pgm_danh_gia    text;
alter table public.weekly_reports add column if not exists t_pgm_giai_phap   text;

alter table public.weekly_reports add column if not exists t_lgm_plan        text;
alter table public.weekly_reports add column if not exists t_lgm_actual      text;
alter table public.weekly_reports add column if not exists t_lgm_danh_gia    text;
alter table public.weekly_reports add column if not exists t_lgm_giai_phap   text;

alter table public.weekly_reports add column if not exists t_con_plan        text;
alter table public.weekly_reports add column if not exists t_con_actual      text;
alter table public.weekly_reports add column if not exists t_con_danh_gia    text;
alter table public.weekly_reports add column if not exists t_con_giai_phap   text;

alter table public.weekly_reports add column if not exists t_brd_plan        text;
alter table public.weekly_reports add column if not exists t_brd_actual      text;
alter table public.weekly_reports add column if not exists t_brd_danh_gia    text;
alter table public.weekly_reports add column if not exists t_brd_giai_phap   text;

-- Schema version flag — distinguish V1 (legacy nhan_xet_*) vs V2 (matrix)
alter table public.weekly_reports add column if not exists ai_schema_version smallint default 1;

-- ═══════════════════════════════════════════════════════════
-- MEDIA OMNI — Migration: thêm 13 plan keys mới × 6 periods
-- Add 78 columns mới vào monthly_plans (không drop data hiện có)
-- ═══════════════════════════════════════════════════════════

-- Shopee CPC: luot_xem, luot_click, don_hang
alter table public.monthly_plans add column if not exists s_cpc_luot_xem__plan_month  bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_luot_xem__plan_w1     bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_luot_xem__plan_w2     bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_luot_xem__plan_w3     bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_luot_xem__plan_w4     bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_luot_xem__plan_w5     bigint default 0;

alter table public.monthly_plans add column if not exists s_cpc_luot_click__plan_month bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_luot_click__plan_w1    bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_luot_click__plan_w2    bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_luot_click__plan_w3    bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_luot_click__plan_w4    bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_luot_click__plan_w5    bigint default 0;

alter table public.monthly_plans add column if not exists s_cpc_don_hang__plan_month  bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_don_hang__plan_w1     bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_don_hang__plan_w2     bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_don_hang__plan_w3     bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_don_hang__plan_w4     bigint default 0;
alter table public.monthly_plans add column if not exists s_cpc_don_hang__plan_w5     bigint default 0;

-- Shopee Nhận Diện: luot_xem, luot_click
alter table public.monthly_plans add column if not exists s_nd_luot_xem__plan_month   bigint default 0;
alter table public.monthly_plans add column if not exists s_nd_luot_xem__plan_w1      bigint default 0;
alter table public.monthly_plans add column if not exists s_nd_luot_xem__plan_w2      bigint default 0;
alter table public.monthly_plans add column if not exists s_nd_luot_xem__plan_w3      bigint default 0;
alter table public.monthly_plans add column if not exists s_nd_luot_xem__plan_w4      bigint default 0;
alter table public.monthly_plans add column if not exists s_nd_luot_xem__plan_w5      bigint default 0;

alter table public.monthly_plans add column if not exists s_nd_luot_click__plan_month bigint default 0;
alter table public.monthly_plans add column if not exists s_nd_luot_click__plan_w1    bigint default 0;
alter table public.monthly_plans add column if not exists s_nd_luot_click__plan_w2    bigint default 0;
alter table public.monthly_plans add column if not exists s_nd_luot_click__plan_w3    bigint default 0;
alter table public.monthly_plans add column if not exists s_nd_luot_click__plan_w4    bigint default 0;
alter table public.monthly_plans add column if not exists s_nd_luot_click__plan_w5    bigint default 0;

-- Shopee Live: luot_xem
alter table public.monthly_plans add column if not exists s_live_luot_xem__plan_month bigint default 0;
alter table public.monthly_plans add column if not exists s_live_luot_xem__plan_w1    bigint default 0;
alter table public.monthly_plans add column if not exists s_live_luot_xem__plan_w2    bigint default 0;
alter table public.monthly_plans add column if not exists s_live_luot_xem__plan_w3    bigint default 0;
alter table public.monthly_plans add column if not exists s_live_luot_xem__plan_w4    bigint default 0;
alter table public.monthly_plans add column if not exists s_live_luot_xem__plan_w5    bigint default 0;

-- TikTok PGM: luot_xem, luot_click, don_hang
alter table public.monthly_plans add column if not exists t_pgm_luot_xem__plan_month  bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_luot_xem__plan_w1     bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_luot_xem__plan_w2     bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_luot_xem__plan_w3     bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_luot_xem__plan_w4     bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_luot_xem__plan_w5     bigint default 0;

alter table public.monthly_plans add column if not exists t_pgm_luot_click__plan_month bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_luot_click__plan_w1    bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_luot_click__plan_w2    bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_luot_click__plan_w3    bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_luot_click__plan_w4    bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_luot_click__plan_w5    bigint default 0;

alter table public.monthly_plans add column if not exists t_pgm_don_hang__plan_month  bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_don_hang__plan_w1     bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_don_hang__plan_w2     bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_don_hang__plan_w3     bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_don_hang__plan_w4     bigint default 0;
alter table public.monthly_plans add column if not exists t_pgm_don_hang__plan_w5     bigint default 0;

-- TikTok Consideration: nguoi
alter table public.monthly_plans add column if not exists t_con_nguoi__plan_month     bigint default 0;
alter table public.monthly_plans add column if not exists t_con_nguoi__plan_w1        bigint default 0;
alter table public.monthly_plans add column if not exists t_con_nguoi__plan_w2        bigint default 0;
alter table public.monthly_plans add column if not exists t_con_nguoi__plan_w3        bigint default 0;
alter table public.monthly_plans add column if not exists t_con_nguoi__plan_w4        bigint default 0;
alter table public.monthly_plans add column if not exists t_con_nguoi__plan_w5        bigint default 0;

-- TikTok Branding: view, follow
alter table public.monthly_plans add column if not exists t_brd_view__plan_month      bigint default 0;
alter table public.monthly_plans add column if not exists t_brd_view__plan_w1         bigint default 0;
alter table public.monthly_plans add column if not exists t_brd_view__plan_w2         bigint default 0;
alter table public.monthly_plans add column if not exists t_brd_view__plan_w3         bigint default 0;
alter table public.monthly_plans add column if not exists t_brd_view__plan_w4         bigint default 0;
alter table public.monthly_plans add column if not exists t_brd_view__plan_w5         bigint default 0;

alter table public.monthly_plans add column if not exists t_brd_follow__plan_month    bigint default 0;
alter table public.monthly_plans add column if not exists t_brd_follow__plan_w1       bigint default 0;
alter table public.monthly_plans add column if not exists t_brd_follow__plan_w2       bigint default 0;
alter table public.monthly_plans add column if not exists t_brd_follow__plan_w3       bigint default 0;
alter table public.monthly_plans add column if not exists t_brd_follow__plan_w4       bigint default 0;
alter table public.monthly_plans add column if not exists t_brd_follow__plan_w5       bigint default 0;

-- ═══════════════════════════════════════════════════════════
-- MEDIA OMNI — Supabase REBUILD v2 (match CSV format)
-- Schema khớp 100% với 3 file CSV: BrandList, Quiz Results, Plan
-- ⚠️ CHẠY SCRIPT NÀY SẼ XOÁ TOÀN BỘ DATA HIỆN TẠI ⚠️
-- ═══════════════════════════════════════════════════════════

/* ── 1. DROP toàn bộ tables cũ ── */
drop table if exists public.weekly_reports cascade;
drop table if exists public.monthly_plans  cascade;
drop table if exists public.brands         cascade;
drop table if exists public.tasks          cascade;
drop table if exists public.quiz_scores    cascade;
drop table if exists public.users          cascade;


/* ═══════════════════════════════════════════
   2. USERS
═══════════════════════════════════════════ */
create table public.users (
  id           uuid default gen_random_uuid() primary key,
  username     text unique not null,
  name         text not null,
  password     text not null,
  role         text not null default 'member' check (role in ('admin','member','upbase')),
  status       text not null default 'active' check (status in ('active','disabled')),
  perms        jsonb default '{}'::jsonb,
  created_at   timestamptz default now()
);

create index users_username on public.users(username);


/* ═══════════════════════════════════════════
   3. BRANDS — match BrandList.csv
   CSV: id, brand_name, assigned_members (string "all" hoặc "user1,user2")
═══════════════════════════════════════════ */
create table public.brands (
  id               uuid default gen_random_uuid() primary key,
  brand_name       text unique not null,
  assigned_members text default 'all',
  active           boolean default true,
  created_at       timestamptz default now()
);

create index brands_active on public.brands(active);


/* ═══════════════════════════════════════════
   4. TASKS
═══════════════════════════════════════════ */
create table public.tasks (
  id            uuid default gen_random_uuid() primary key,
  task_name     text not null,
  description   text,
  assignee      text not null,
  assignee_name text,
  date          date not null,
  time_start    time,
  time_end      time,
  priority      text default 'medium' check (priority in ('high','medium','low')),
  status        text default 'todo'   check (status in ('todo','done')),
  created_by    text,
  created_name  text,
  created_at    timestamptz default now()
);

create index tasks_assignee_date on public.tasks(assignee, date);
create index tasks_date          on public.tasks(date);


/* ═══════════════════════════════════════════
   5. QUIZ_SCORES — match Quiz Results.csv
   CSV: Timestamp, Username, Họ tên, Role, Loại quiz, Chủ đề,
        Điểm, Tổng câu, %, Thời gian (phút), Ngày làm
═══════════════════════════════════════════ */
create table public.quiz_scores (
  id            uuid default gen_random_uuid() primary key,
  username      text not null,                      -- Username
  name          text,                                -- Họ tên
  role          text,                                -- Role
  quiz_type     text,                                -- Loại quiz
  topic         text,                                -- Chủ đề
  score         int  default 0,                      -- Điểm
  total         int  default 0,                      -- Tổng câu
  percentage    int  default 0,                      -- %
  duration_min  int  default 0,                      -- Thời gian (phút)
  quiz_date     text,                                -- Ngày làm (giữ nguyên định dạng VN: 28/4/2026)
  created_at    timestamptz default now()            -- Timestamp (tự sinh nếu CSV không map)
);

create index quiz_scores_username on public.quiz_scores(username);


/* ═══════════════════════════════════════════
   6. WEEKLY_REPORTS  — báo cáo tuần (giữ nguyên - đã OK)
═══════════════════════════════════════════ */
create table public.weekly_reports (
  id               uuid default gen_random_uuid() primary key,
  username         text not null,
  brand_name       text not null,
  month            int  not null,
  year             int  not null,
  week_num         int  not null,
  week_start       date,
  week_end         date,

  -- Shopee CPC
  s_cpc_doanh_so   bigint default 0,
  s_cpc_chi_phi    bigint default 0,
  s_cpc_luot_xem   bigint default 0,
  s_cpc_luot_click bigint default 0,
  s_cpc_don_hang   int    default 0,

  -- Shopee Nhận Diện
  s_nd_gmv         bigint default 0,
  s_nd_chi_phi     bigint default 0,
  s_nd_luot_xem    bigint default 0,
  s_nd_luot_click  bigint default 0,

  -- Shopee Livestream
  s_live_gmv       bigint default 0,
  s_live_chi_phi   bigint default 0,
  s_live_luot_xem  bigint default 0,

  -- TikTok PGM
  t_pgm_doanh_so   bigint default 0,
  t_pgm_chi_phi    bigint default 0,
  t_pgm_luot_xem   bigint default 0,
  t_pgm_luot_click bigint default 0,
  t_pgm_don_hang   int    default 0,

  -- TikTok LGM
  t_lgm_doanhthu   bigint default 0,
  t_lgm_chi_phi    bigint default 0,

  -- TikTok Consideration
  t_con_nguoi      int    default 0,
  t_con_chi_phi    bigint default 0,

  -- TikTok Branding
  t_brd_view       bigint default 0,
  t_brd_follow     int    default 0,
  t_brd_chi_phi    bigint default 0,

  -- AI nhận xét
  highlight             text,
  lowlight              text,
  nhan_xet_thuc_trang   text,
  nhan_xet_van_de       text,
  nhan_xet_giai_phap    text,

  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  unique(username, brand_name, year, month, week_num)
);

create index wr_username           on public.weekly_reports(username);
create index wr_brand_year_month   on public.weekly_reports(brand_name, year, month);


/* ═══════════════════════════════════════════
   7. MONTHLY_PLANS — match Plan.csv (FLAT FORMAT)
   25 metric keys × 6 periods (plan_month, plan_w1...w5) = 150 cols
   Một row per (username, brand_name, month, year)
═══════════════════════════════════════════ */
create table public.monthly_plans (
  id          uuid default gen_random_uuid() primary key,
  username    text,
  brand_name  text not null,
  month       int  not null,
  year        int  not null,

  -- ── Shopee CPC (5 keys) ──
  s_cpc_doanh_so__plan_month bigint default 0,
  s_cpc_doanh_so__plan_w1    bigint default 0,
  s_cpc_doanh_so__plan_w2    bigint default 0,
  s_cpc_doanh_so__plan_w3    bigint default 0,
  s_cpc_doanh_so__plan_w4    bigint default 0,
  s_cpc_doanh_so__plan_w5    bigint default 0,
  s_cpc_chi_phi__plan_month  bigint default 0,
  s_cpc_chi_phi__plan_w1     bigint default 0,
  s_cpc_chi_phi__plan_w2     bigint default 0,
  s_cpc_chi_phi__plan_w3     bigint default 0,
  s_cpc_chi_phi__plan_w4     bigint default 0,
  s_cpc_chi_phi__plan_w5     bigint default 0,
  s_cpc_luot_xem__plan_month  bigint default 0,
  s_cpc_luot_xem__plan_w1     bigint default 0,
  s_cpc_luot_xem__plan_w2     bigint default 0,
  s_cpc_luot_xem__plan_w3     bigint default 0,
  s_cpc_luot_xem__plan_w4     bigint default 0,
  s_cpc_luot_xem__plan_w5     bigint default 0,
  s_cpc_luot_click__plan_month bigint default 0,
  s_cpc_luot_click__plan_w1    bigint default 0,
  s_cpc_luot_click__plan_w2    bigint default 0,
  s_cpc_luot_click__plan_w3    bigint default 0,
  s_cpc_luot_click__plan_w4    bigint default 0,
  s_cpc_luot_click__plan_w5    bigint default 0,
  s_cpc_don_hang__plan_month  bigint default 0,
  s_cpc_don_hang__plan_w1     bigint default 0,
  s_cpc_don_hang__plan_w2     bigint default 0,
  s_cpc_don_hang__plan_w3     bigint default 0,
  s_cpc_don_hang__plan_w4     bigint default 0,
  s_cpc_don_hang__plan_w5     bigint default 0,

  -- ── Shopee Nhận Diện (4 keys) ──
  s_nd_gmv__plan_month       bigint default 0,
  s_nd_gmv__plan_w1          bigint default 0,
  s_nd_gmv__plan_w2          bigint default 0,
  s_nd_gmv__plan_w3          bigint default 0,
  s_nd_gmv__plan_w4          bigint default 0,
  s_nd_gmv__plan_w5          bigint default 0,
  s_nd_chi_phi__plan_month   bigint default 0,
  s_nd_chi_phi__plan_w1      bigint default 0,
  s_nd_chi_phi__plan_w2      bigint default 0,
  s_nd_chi_phi__plan_w3      bigint default 0,
  s_nd_chi_phi__plan_w4      bigint default 0,
  s_nd_chi_phi__plan_w5      bigint default 0,
  s_nd_luot_xem__plan_month   bigint default 0,
  s_nd_luot_xem__plan_w1      bigint default 0,
  s_nd_luot_xem__plan_w2      bigint default 0,
  s_nd_luot_xem__plan_w3      bigint default 0,
  s_nd_luot_xem__plan_w4      bigint default 0,
  s_nd_luot_xem__plan_w5      bigint default 0,
  s_nd_luot_click__plan_month bigint default 0,
  s_nd_luot_click__plan_w1    bigint default 0,
  s_nd_luot_click__plan_w2    bigint default 0,
  s_nd_luot_click__plan_w3    bigint default 0,
  s_nd_luot_click__plan_w4    bigint default 0,
  s_nd_luot_click__plan_w5    bigint default 0,

  -- ── Shopee Livestream (3 keys) ──
  s_live_gmv__plan_month     bigint default 0,
  s_live_gmv__plan_w1        bigint default 0,
  s_live_gmv__plan_w2        bigint default 0,
  s_live_gmv__plan_w3        bigint default 0,
  s_live_gmv__plan_w4        bigint default 0,
  s_live_gmv__plan_w5        bigint default 0,
  s_live_chi_phi__plan_month bigint default 0,
  s_live_chi_phi__plan_w1    bigint default 0,
  s_live_chi_phi__plan_w2    bigint default 0,
  s_live_chi_phi__plan_w3    bigint default 0,
  s_live_chi_phi__plan_w4    bigint default 0,
  s_live_chi_phi__plan_w5    bigint default 0,
  s_live_luot_xem__plan_month bigint default 0,
  s_live_luot_xem__plan_w1    bigint default 0,
  s_live_luot_xem__plan_w2    bigint default 0,
  s_live_luot_xem__plan_w3    bigint default 0,
  s_live_luot_xem__plan_w4    bigint default 0,
  s_live_luot_xem__plan_w5    bigint default 0,

  -- ── TikTok PGM (5 keys) ──
  t_pgm_doanh_so__plan_month bigint default 0,
  t_pgm_doanh_so__plan_w1    bigint default 0,
  t_pgm_doanh_so__plan_w2    bigint default 0,
  t_pgm_doanh_so__plan_w3    bigint default 0,
  t_pgm_doanh_so__plan_w4    bigint default 0,
  t_pgm_doanh_so__plan_w5    bigint default 0,
  t_pgm_chi_phi__plan_month  bigint default 0,
  t_pgm_chi_phi__plan_w1     bigint default 0,
  t_pgm_chi_phi__plan_w2     bigint default 0,
  t_pgm_chi_phi__plan_w3     bigint default 0,
  t_pgm_chi_phi__plan_w4     bigint default 0,
  t_pgm_chi_phi__plan_w5     bigint default 0,
  t_pgm_luot_xem__plan_month  bigint default 0,
  t_pgm_luot_xem__plan_w1     bigint default 0,
  t_pgm_luot_xem__plan_w2     bigint default 0,
  t_pgm_luot_xem__plan_w3     bigint default 0,
  t_pgm_luot_xem__plan_w4     bigint default 0,
  t_pgm_luot_xem__plan_w5     bigint default 0,
  t_pgm_luot_click__plan_month bigint default 0,
  t_pgm_luot_click__plan_w1    bigint default 0,
  t_pgm_luot_click__plan_w2    bigint default 0,
  t_pgm_luot_click__plan_w3    bigint default 0,
  t_pgm_luot_click__plan_w4    bigint default 0,
  t_pgm_luot_click__plan_w5    bigint default 0,
  t_pgm_don_hang__plan_month  bigint default 0,
  t_pgm_don_hang__plan_w1     bigint default 0,
  t_pgm_don_hang__plan_w2     bigint default 0,
  t_pgm_don_hang__plan_w3     bigint default 0,
  t_pgm_don_hang__plan_w4     bigint default 0,
  t_pgm_don_hang__plan_w5     bigint default 0,

  -- ── TikTok LGM (2 keys) ──
  t_lgm_doanhthu__plan_month bigint default 0,
  t_lgm_doanhthu__plan_w1    bigint default 0,
  t_lgm_doanhthu__plan_w2    bigint default 0,
  t_lgm_doanhthu__plan_w3    bigint default 0,
  t_lgm_doanhthu__plan_w4    bigint default 0,
  t_lgm_doanhthu__plan_w5    bigint default 0,
  t_lgm_chi_phi__plan_month  bigint default 0,
  t_lgm_chi_phi__plan_w1     bigint default 0,
  t_lgm_chi_phi__plan_w2     bigint default 0,
  t_lgm_chi_phi__plan_w3     bigint default 0,
  t_lgm_chi_phi__plan_w4     bigint default 0,
  t_lgm_chi_phi__plan_w5     bigint default 0,

  -- ── TikTok Consideration (2 keys) ──
  t_con_nguoi__plan_month    bigint default 0,
  t_con_nguoi__plan_w1       bigint default 0,
  t_con_nguoi__plan_w2       bigint default 0,
  t_con_nguoi__plan_w3       bigint default 0,
  t_con_nguoi__plan_w4       bigint default 0,
  t_con_nguoi__plan_w5       bigint default 0,
  t_con_chi_phi__plan_month  bigint default 0,
  t_con_chi_phi__plan_w1     bigint default 0,
  t_con_chi_phi__plan_w2     bigint default 0,
  t_con_chi_phi__plan_w3     bigint default 0,
  t_con_chi_phi__plan_w4     bigint default 0,
  t_con_chi_phi__plan_w5     bigint default 0,

  -- ── TikTok Branding (3 keys) ──
  t_brd_view__plan_month     bigint default 0,
  t_brd_view__plan_w1        bigint default 0,
  t_brd_view__plan_w2        bigint default 0,
  t_brd_view__plan_w3        bigint default 0,
  t_brd_view__plan_w4        bigint default 0,
  t_brd_view__plan_w5        bigint default 0,
  t_brd_follow__plan_month   bigint default 0,
  t_brd_follow__plan_w1      bigint default 0,
  t_brd_follow__plan_w2      bigint default 0,
  t_brd_follow__plan_w3      bigint default 0,
  t_brd_follow__plan_w4      bigint default 0,
  t_brd_follow__plan_w5      bigint default 0,
  t_brd_chi_phi__plan_month  bigint default 0,
  t_brd_chi_phi__plan_w1     bigint default 0,
  t_brd_chi_phi__plan_w2     bigint default 0,
  t_brd_chi_phi__plan_w3     bigint default 0,
  t_brd_chi_phi__plan_w4     bigint default 0,
  t_brd_chi_phi__plan_w5     bigint default 0,

  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  unique(username, brand_name, month, year)
);

create index mp_brand_year_month on public.monthly_plans(brand_name, year, month);
create index mp_username         on public.monthly_plans(username);


/* ═══════════════════════════════════════════
   8. SEED USERS — 13 thành viên
═══════════════════════════════════════════ */
insert into public.users (username, name, password, role, status) values
  ('quangnd',  'Nguyễn Đức Quảng',         'omni2026lead', 'admin',  'active'),
  ('linhntkh', 'Nguyễn Trần Khánh Linh',   'omni2026',     'member', 'active'),
  ('duychk',   'Chu Khánh Duy',             'omni2026',     'member', 'active'),
  ('ductanh',  'Thiều Anh Đức',             'omni2026',     'member', 'active'),
  ('linhdkh',  'Đoàn Khánh Linh',           'omni2026',     'member', 'active'),
  ('thaodph',  'Đỗ Phương Thảo',            'omni2026',     'member', 'active'),
  ('hangdth',  'Đỗ Thị Hằng',               'omni2026',     'member', 'active'),
  ('trungdhu', 'Đặng Hữu Trung',            'omni2026',     'member', 'active'),
  ('anhpq',    'Phạm Quyền Anh',            'omni2026',     'member', 'active'),
  ('khanhnm',  'Nguyễn Minh Khánh',         'omni2026',     'member', 'active'),
  ('ngochb',   'Hoàng Bảo Ngọc',            'omni2026',     'member', 'active'),
  ('phuongnm', 'Nguyễn Mai Phương',         'omni2026',     'member', 'active'),
  ('upbase',   'UpBase Staff',               'upbase2026',   'upbase', 'active');


/* ═══════════════════════════════════════════
   9. DISABLE RLS
═══════════════════════════════════════════ */
alter table public.users          disable row level security;
alter table public.tasks          disable row level security;
alter table public.quiz_scores    disable row level security;
alter table public.brands         disable row level security;
alter table public.weekly_reports disable row level security;
alter table public.monthly_plans  disable row level security;

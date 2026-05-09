-- ═══════════════════════════════════════════════════════════
-- MEDIA OMNI — Supabase REBUILD (clean slate)
-- Chạy script này trong Supabase SQL Editor để xoá toàn bộ
-- và tạo lại tables theo cấu trúc chuẩn của app Next.js mới.
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
   2. USERS  — đăng nhập + phân quyền
═══════════════════════════════════════════ */
create table public.users (
  id           uuid default gen_random_uuid() primary key,
  username     text unique not null,
  name         text not null,
  password     text not null,                              -- bcrypt hash sau lần login đầu
  role         text not null default 'member' check (role in ('admin','member','upbase')),
  status       text not null default 'active' check (status in ('active','disabled')),
  perms        jsonb default '{}'::jsonb,                  -- per-feature perms nếu cần
  created_at   timestamptz default now()
);

create index users_username on public.users(username);


/* ═══════════════════════════════════════════
   3. BRANDS  — danh sách brand cho report tool
   Bạn sẽ tự input data ở /hub/users hoặc qua report tool
═══════════════════════════════════════════ */
create table public.brands (
  id               uuid default gen_random_uuid() primary key,
  brand_name       text unique not null,
  assigned_members text[] default '{}',                    -- mảng username được assign
  active           boolean default true,
  created_at       timestamptz default now()
);

create index brands_active on public.brands(active);


/* ═══════════════════════════════════════════
   4. TASKS  — Daily Tasks tool
═══════════════════════════════════════════ */
create table public.tasks (
  id            uuid default gen_random_uuid() primary key,
  task_name     text not null,
  description   text,
  assignee      text not null,                             -- username
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
   5. QUIZ_SCORES  — kết quả bài quiz
═══════════════════════════════════════════ */
create table public.quiz_scores (
  id          uuid default gen_random_uuid() primary key,
  username    text not null,
  name        text,
  quiz_type   text,                                        -- 'd1', 'd2', 'upbase', etc.
  score       int  default 0,
  total       int  default 0,
  percentage  int  default 0,
  created_at  timestamptz default now()
);

create index quiz_scores_username on public.quiz_scores(username);


/* ═══════════════════════════════════════════
   6. WEEKLY_REPORTS  — báo cáo tuần (Shopee + TikTok)
   Match đúng với app/hub/report/page.tsx
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

  -- ── Shopee CPC (Search Ads) ──
  s_cpc_doanh_so   bigint default 0,
  s_cpc_chi_phi    bigint default 0,
  s_cpc_luot_xem   bigint default 0,
  s_cpc_luot_click bigint default 0,
  s_cpc_don_hang   int    default 0,

  -- ── Shopee Nhận Diện (Display Ads) ──
  s_nd_gmv         bigint default 0,
  s_nd_chi_phi     bigint default 0,
  s_nd_luot_xem    bigint default 0,
  s_nd_luot_click  bigint default 0,

  -- ── Shopee Livestream Ads ──
  s_live_gmv       bigint default 0,
  s_live_chi_phi   bigint default 0,
  s_live_luot_xem  bigint default 0,

  -- ── TikTok PGM (Product GMV) ──
  t_pgm_doanh_so   bigint default 0,
  t_pgm_chi_phi    bigint default 0,
  t_pgm_luot_xem   bigint default 0,
  t_pgm_luot_click bigint default 0,
  t_pgm_don_hang   int    default 0,

  -- ── TikTok LGM (Live GMV) ──
  t_lgm_doanhthu   bigint default 0,
  t_lgm_chi_phi    bigint default 0,

  -- ── TikTok Consideration ──
  t_con_nguoi      int    default 0,
  t_con_chi_phi    bigint default 0,

  -- ── TikTok Branding ──
  t_brd_view       bigint default 0,
  t_brd_follow     int    default 0,
  t_brd_chi_phi    bigint default 0,

  -- ── AI nhận xét (DARA framework) ──
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
create index wr_brand_week         on public.weekly_reports(brand_name, year, month, week_num);


/* ═══════════════════════════════════════════
   7. MONTHLY_PLANS  — kế hoạch tháng theo platform
   plan_data JSONB structure:
   {
     "s_cpc_doanh_so": { "w1": 0, "w2": 0, "w3": 0, "w4": 0, "w5": 0, "mtd": 0, "month": 0 },
     "s_cpc_chi_phi":  { ... },
     ...
   }
═══════════════════════════════════════════ */
create table public.monthly_plans (
  id          uuid default gen_random_uuid() primary key,
  brand_name  text not null,
  platform    text not null check (platform in ('shopee','tiktok')),
  month       int  not null,
  year        int  not null,
  plan_data   jsonb default '{}'::jsonb,
  created_by  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  unique(brand_name, platform, month, year)
);

create index mp_brand_year_month on public.monthly_plans(brand_name, year, month);
create index mp_platform         on public.monthly_plans(platform);


/* ═══════════════════════════════════════════
   8. SEED USERS  — 13 thành viên
   Password plaintext lần đầu, app sẽ tự bcrypt hash khi login
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
   9. DISABLE RLS  — internal tool, không public
═══════════════════════════════════════════ */
alter table public.users          disable row level security;
alter table public.tasks          disable row level security;
alter table public.quiz_scores    disable row level security;
alter table public.brands         disable row level security;
alter table public.weekly_reports disable row level security;
alter table public.monthly_plans  disable row level security;


/* ═══════════════════════════════════════════
   ✅ XONG
   - 6 tables: users, brands, tasks, quiz_scores, weekly_reports, monthly_plans
   - 13 seed users (admin + 12 members + 1 upbase)
   - 0 brands (bạn tự thêm qua /hub/report hoặc /hub/users)
   - 0 reports / plans / tasks / scores
═══════════════════════════════════════════ */

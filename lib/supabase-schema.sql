-- ═══════════════════════════════════════════
-- MEDIA OMNI — Supabase Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- USERS
create table if not exists public.users (
  id           uuid default gen_random_uuid() primary key,
  username     text unique not null,
  name         text not null,
  password     text not null,
  role         text not null default 'member' check (role in ('admin','member','upbase')),
  status       text not null default 'active' check (status in ('active','disabled')),
  perms        jsonb default '{}'::jsonb,
  created_at   timestamptz default now()
);

-- TASKS
create table if not exists public.tasks (
  id            uuid default gen_random_uuid() primary key,
  task_name     text not null,
  description   text,
  assignee      text not null,
  assignee_name text,
  date          date not null,
  time_start    time,
  time_end      time,
  priority      text default 'medium' check (priority in ('high','medium','low')),
  status        text default 'todo' check (status in ('todo','done')),
  created_by    text,
  created_name  text,
  created_at    timestamptz default now()
);

create index if not exists tasks_assignee_date on public.tasks(assignee, date);
create index if not exists tasks_date on public.tasks(date);

-- QUIZ SCORES
create table if not exists public.quiz_scores (
  id          uuid default gen_random_uuid() primary key,
  username    text not null,
  name        text,
  quiz_type   text,
  score       int default 0,
  total       int default 0,
  percentage  int default 0,
  created_at  timestamptz default now()
);

create index if not exists quiz_scores_username on public.quiz_scores(username);

-- WEEKLY REPORTS
create table if not exists public.weekly_reports (
  id               uuid default gen_random_uuid() primary key,
  username         text not null,
  brand_name       text not null,
  month            int,
  year             int,
  week_num         int,
  week_start       date,
  week_end         date,
  -- Shopee CPC
  s_cpc_doanh_so   bigint default 0,
  s_cpc_chi_phi    bigint default 0,
  s_cpc_luot_xem   bigint default 0,
  s_cpc_luot_click bigint default 0,
  s_cpc_don_hang   int default 0,
  -- Shopee ND
  s_nd_gmv         bigint default 0,
  s_nd_chi_phi     bigint default 0,
  s_nd_luot_xem    bigint default 0,
  s_nd_luot_click  bigint default 0,
  -- Shopee Live
  s_live_gmv       bigint default 0,
  s_live_chi_phi   bigint default 0,
  s_live_luot_xem  bigint default 0,
  -- TikTok PGM
  t_pgm_doanh_so   bigint default 0,
  t_pgm_chi_phi    bigint default 0,
  t_pgm_luot_xem   bigint default 0,
  t_pgm_luot_click bigint default 0,
  t_pgm_don_hang   int default 0,
  -- TikTok LGM
  t_lgm_doanhthu   bigint default 0,
  t_lgm_chi_phi    bigint default 0,
  -- TikTok Con người
  t_con_nguoi      int default 0,
  t_con_chi_phi    bigint default 0,
  -- TikTok Brand
  t_brd_view       bigint default 0,
  t_brd_follow     int default 0,
  t_brd_chi_phi    bigint default 0,
  -- Notes
  highlight        text,
  lowlight         text,
  nhan_xet_thuc_trang text,
  nhan_xet_van_de     text,
  nhan_xet_giai_phap  text,
  created_at       timestamptz default now(),
  unique(username, brand_name, year, month, week_num)
);

create index if not exists wr_username on public.weekly_reports(username);
create index if not exists wr_brand_year_month on public.weekly_reports(brand_name, year, month);

-- BRANDS (for report assignment)
create table if not exists public.brands (
  id               uuid default gen_random_uuid() primary key,
  brand_name       text unique not null,
  assigned_members text[] default '{}',
  active           boolean default true,
  created_at       timestamptz default now()
);

-- ── SEED USERS ──
-- Passwords are plain text here; the app hashes them on first login
-- After running this, the app will auto-hash on first use
-- For now we store plaintext and hash in the API route

insert into public.users (username, name, password, role, status) values
  ('quangnd',  'Nguyễn Đức Quảng',       'omni2026lead', 'admin',  'active'),
  ('linhntkh', 'Nguyễn Trần Khánh Linh', 'omni2026',     'member', 'active'),
  ('duychk',   'Chu Khánh Duy',           'omni2026',     'member', 'active'),
  ('ductanh',  'Thiều Anh Đức',           'omni2026',     'member', 'active'),
  ('linhdkh',  'Đoàn Khánh Linh',         'omni2026',     'member', 'active'),
  ('thaodph',  'Đỗ Phương Thảo',          'omni2026',     'member', 'active'),
  ('hangdth',  'Đỗ Thị Hằng',             'omni2026',     'member', 'active'),
  ('trungdhu', 'Đặng Hữu Trung',          'omni2026',     'member', 'active'),
  ('anhpq',    'Phạm Quyền Anh',          'omni2026',     'member', 'active'),
  ('khanhnm',  'Nguyễn Minh Khánh',       'omni2026',     'member', 'active'),
  ('ngochb',   'Hoàng Bảo Ngọc',          'omni2026',     'member', 'active'),
  ('phuongnm', 'Nguyễn Mai Phương',       'omni2026',     'member', 'active'),
  ('upbase',   'UpBase Staff',             'upbase2026',   'upbase', 'active')
on conflict (username) do nothing;

-- ── SEED BRANDS ──
insert into public.brands (brand_name, assigned_members) values
  ('Meracine',        '{"quangnd"}'),
  ('Bye Bye Blemish', '{"quangnd"}'),
  ('Yumvita',         '{"quangnd"}')
on conflict (brand_name) do nothing;

-- ── DISABLE RLS (internal tool, no public access) ──
alter table public.users         disable row level security;
alter table public.tasks         disable row level security;
alter table public.quiz_scores   disable row level security;
alter table public.weekly_reports disable row level security;
alter table public.brands        disable row level security;

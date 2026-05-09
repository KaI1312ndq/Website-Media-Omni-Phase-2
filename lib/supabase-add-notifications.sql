-- Notifications table for in-app bell dropdown.
-- Run this in Supabase SQL Editor.

create table if not exists public.notifications (
  id           uuid default gen_random_uuid() primary key,
  recipient    text not null,                   -- username
  type         text not null,                    -- 'report_due', 'report_late', 'lead_new', 'plan_missing', 'system'
  title        text not null,
  body         text,
  link         text,                              -- relative URL e.g. '/admin/leads' or '/hub/report?brand=X'
  icon         text,                              -- icon name from Icon set
  priority     text default 'normal' check (priority in ('low','normal','high','urgent')),
  read_at      timestamptz,
  created_at   timestamptz default now()
);

create index if not exists notif_recipient_unread on public.notifications(recipient, created_at desc) where read_at is null;
create index if not exists notif_recipient_all on public.notifications(recipient, created_at desc);

alter table public.notifications disable row level security;

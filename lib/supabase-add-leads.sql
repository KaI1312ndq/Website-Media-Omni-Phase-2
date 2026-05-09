-- ──────────────────────────────────────────────────────────────────
-- Migration: leads table (Lead capture form)
-- Run in Supabase SQL Editor.
-- ──────────────────────────────────────────────────────────────────

create table if not exists public.leads (
  id           uuid default gen_random_uuid() primary key,
  name         text not null,
  email        text not null,
  phone        text,
  brand        text,
  channels     text[] default '{}',           -- ['shopee','tiktok','meta','google','livestream']
  monthly_budget text,                          -- '<50M', '50-200M', '200-500M', '>500M'
  note         text,
  status       text default 'new' check (status in ('new','contacted','qualified','closed')),
  source       text default 'homepage',
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  ip_address   text,
  user_agent   text,
  contacted_at timestamptz,
  contacted_by text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists leads_status on public.leads(status);
create index if not exists leads_created on public.leads(created_at desc);

alter table public.leads disable row level security;

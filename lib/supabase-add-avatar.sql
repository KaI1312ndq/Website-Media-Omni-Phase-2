-- Migration: add avatar_url column to public.users
-- Run this in Supabase SQL editor before using profile avatar upload.

alter table public.users add column if not exists avatar_url text;

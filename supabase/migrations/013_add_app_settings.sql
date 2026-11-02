-- Run this in Supabase SQL Editor on the existing project.
-- One-row settings table. Holds the Notification switch and the webhook URL
-- (an n8n workflow; the URL may contain a secret path): RLS on, no policies,
-- only this app's server code (service role) ever reads or writes it.

create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  notification_enabled boolean not null default false,
  notification_webhook_url text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

insert into public.app_settings (id) values (1) on conflict do nothing;

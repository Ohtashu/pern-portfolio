-- Run after admin.sql has created public.admin_users. This migration does not alter other tables or their policies.
create table if not exists public.portfolio_settings (
    id smallint primary key default 1 check (id = 1),
    name text not null default '',
    intro text not null default '',
    bio text[] not null default array['', '']::text[] check (cardinality(bio) = 2),
    roles text[] not null default '{}',
    skills text[] not null default '{}',
    toolbox text[] not null default '{}',
    location text not null default '',
    focus text not null default '',
    education text not null default '',
    email text not null default '',
    social_links jsonb not null default '[]'::jsonb check (jsonb_typeof(social_links) = 'array'),
    cv_url text not null default '',
    updated_at timestamptz not null default now()
);

alter table public.portfolio_settings alter column focus set default '';

alter table public.portfolio_settings enable row level security;
grant select on public.portfolio_settings to anon, authenticated;
revoke insert, update, delete on public.portfolio_settings from anon;
grant insert, update on public.portfolio_settings to authenticated;
revoke delete on public.portfolio_settings from authenticated;

drop policy if exists portfolio_settings_public_read on public.portfolio_settings;
create policy portfolio_settings_public_read on public.portfolio_settings for select to anon, authenticated using (true);
drop policy if exists portfolio_settings_admin_insert on public.portfolio_settings;
create policy portfolio_settings_admin_insert on public.portfolio_settings for insert to authenticated
    with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists portfolio_settings_admin_update on public.portfolio_settings;
create policy portfolio_settings_admin_update on public.portfolio_settings for update to authenticated
    using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
    with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
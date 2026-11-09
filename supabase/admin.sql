-- This intentionally replaces every existing policy on public.projects.
-- Review those policies first if another application shares the table.
alter table public.projects enable row level security;

do $$
declare
    existing_policy record;
begin
    for existing_policy in
        select policyname
        from pg_policies
        where schemaname = 'public'
          and tablename = 'projects'
    loop
        execute format('drop policy %I on public.projects', existing_policy.policyname);
    end loop;
end;
$$;

create table if not exists public.admin_users (
    user_id uuid primary key references auth.users (id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists admin_users_select_self on public.admin_users;
create policy admin_users_select_self
    on public.admin_users
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

grant select on public.projects to anon, authenticated;
revoke insert, update, delete on public.projects from anon;
grant insert, update, delete on public.projects to authenticated;

create policy projects_public_read
    on public.projects
    for select
    to anon, authenticated
    using (true);

create policy projects_admin_insert
    on public.projects
    for insert
    to authenticated
    with check (
        exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    );

create policy projects_admin_update
    on public.projects
    for update
    to authenticated
    using (
        exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    )
    with check (
        exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    );

create policy projects_admin_delete
    on public.projects
    for delete
    to authenticated
    using (
        exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    );

-- ============================================================================
-- Experience Table Policies & Grants
-- ============================================================================
alter table if exists public.experience enable row level security;

do $$
declare
    existing_policy record;
begin
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'experience') then
        for existing_policy in
            select policyname
            from pg_policies
            where schemaname = 'public'
              and tablename = 'experience'
        loop
            execute format('drop policy %I on public.experience', existing_policy.policyname);
        end loop;
    end if;
end;
$$;

grant select on public.experience to anon, authenticated;
revoke insert, update, delete on public.experience from anon;
grant insert, update, delete on public.experience to authenticated;

create policy experience_public_read
    on public.experience
    for select
    to anon, authenticated
    using (true);

create policy experience_admin_insert
    on public.experience
    for insert
    to authenticated
    with check (
        exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    );

create policy experience_admin_update
    on public.experience
    for update
    to authenticated
    using (
        exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    )
    with check (
        exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    );

create policy experience_admin_delete
    on public.experience
    for delete
    to authenticated
    using (
        exists (
            select 1
            from public.admin_users
            where user_id = (select auth.uid())
        )
    );

-- After running this script, add the UUID from Authentication → Users:
-- insert into public.admin_users (user_id) values ('YOUR-AUTH-USER-UUID');
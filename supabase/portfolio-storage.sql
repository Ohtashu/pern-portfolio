-- Run after admin.sql. Review existing storage.objects policies before applying.
-- These public buckets must contain only files intended for everyone to see.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
    ('portfolio-cvs', 'portfolio-cvs', true, 5242880, array['application/pdf']),
    ('portfolio-project-images', 'portfolio-project-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists portfolio_storage_public_read on storage.objects;
create policy portfolio_storage_public_read on storage.objects for select to anon, authenticated
    using (bucket_id in ('portfolio-cvs', 'portfolio-project-images'));

drop policy if exists portfolio_storage_admin_insert on storage.objects;
create policy portfolio_storage_admin_insert on storage.objects for insert to authenticated
    with check (bucket_id in ('portfolio-cvs', 'portfolio-project-images') and exists
        (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists portfolio_storage_admin_update on storage.objects;
create policy portfolio_storage_admin_update on storage.objects for update to authenticated
    using (bucket_id in ('portfolio-cvs', 'portfolio-project-images') and exists
        (select 1 from public.admin_users where user_id = (select auth.uid())))
    with check (bucket_id in ('portfolio-cvs', 'portfolio-project-images') and exists
        (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists portfolio_storage_admin_delete on storage.objects;
create policy portfolio_storage_admin_delete on storage.objects for delete to authenticated
    using (bucket_id in ('portfolio-cvs', 'portfolio-project-images') and exists
        (select 1 from public.admin_users where user_id = (select auth.uid())));

-- Restrictive policies also constrain any pre-existing permissive write policies.
-- Conditions allow unrelated buckets through unchanged, including moves between buckets.
do $$
declare
    operation text;
    role_name text;
    predicate text;
    clauses text;
    policy_name text;
begin
    foreach role_name in array array['anon', 'authenticated'] loop
        predicate := 'bucket_id not in (''portfolio-cvs'', ''portfolio-project-images'')';
        if role_name = 'authenticated' then
            predicate := predicate || ' or exists (select 1 from public.admin_users where user_id = (select auth.uid()))';
        end if;
        foreach operation in array array['insert', 'update', 'delete'] loop
            policy_name := 'portfolio_storage_guard_' || role_name || '_' || operation;
            execute format('drop policy if exists %I on storage.objects', policy_name);
            clauses := case operation
                when 'insert' then format('with check (%s)', predicate)
                when 'update' then format('using (%s) with check (%s)', predicate, predicate)
                else format('using (%s)', predicate)
            end;
            execute format('create policy %I on storage.objects as restrictive for %s to %I %s',
                policy_name, operation, role_name, clauses);
        end loop;
    end loop;
end;
$$;

commit;
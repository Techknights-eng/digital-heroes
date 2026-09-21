-- Phase 10: public charity discovery and owner-scoped charity selection.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lower(role) = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.charities enable row level security;
alter table public.charity_events enable row level security;
alter table public.charity_contributions enable row level security;

drop policy if exists "Public can view active charities" on public.charities;
create policy "Public can view active charities"
  on public.charities for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Admins can manage charities" on public.charities;
create policy "Admins can manage charities"
  on public.charities for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Public can view active charity events" on public.charity_events;
create policy "Public can view active charity events"
  on public.charity_events for select
  to anon, authenticated
  using (exists (
    select 1
    from public.charities
    where charities.id = charity_events.charity_id
      and charities.is_active = true
  ));

drop policy if exists "Admins can manage charity events" on public.charity_events;
create policy "Admins can manage charity events"
  on public.charity_events for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Users can view their own charity contributions" on public.charity_contributions;
create policy "Users can view their own charity contributions"
  on public.charity_contributions for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Admins can manage charity contributions" on public.charity_contributions;
create policy "Admins can manage charity contributions"
  on public.charity_contributions for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create or replace function public.select_charity(p_charity_id text, p_percentage integer)
returns setof public.charity_contributions
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_contribution_id text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if p_percentage is null or p_percentage < 10 or p_percentage > 100 then
    raise exception 'Contribution percentage must be between 10 and 100';
  end if;

  if not exists (
    select 1
    from public.charities
    where id::text = p_charity_id
      and is_active = true
  ) then
    raise exception 'That charity is not available';
  end if;

  select id::text into current_contribution_id
  from public.charity_contributions
  where user_id = current_user_id
  order by created_at desc, id desc
  limit 1;

  if current_contribution_id is null then
    insert into public.charity_contributions (user_id, charity_id, percentage)
    values (current_user_id, p_charity_id::uuid, p_percentage);
  else
    update public.charity_contributions
    set charity_id = p_charity_id::uuid,
        percentage = p_percentage
    where id::text = current_contribution_id
      and user_id = current_user_id;
  end if;

  return query
    select *
    from public.charity_contributions
    where user_id = current_user_id
    order by created_at desc, id desc
    limit 1;
end;
$$;

revoke all on function public.select_charity(text, integer) from public;
grant execute on function public.select_charity(text, integer) to authenticated;
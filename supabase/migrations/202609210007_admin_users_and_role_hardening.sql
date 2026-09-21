-- Phase 16: admin user management and role-change hardening.

drop policy if exists "Users can insert their own golf scores" on public.golf_scores;
create policy "Users can insert their own golf scores"
  on public.golf_scores for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create or replace function public.prevent_non_admin_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role then
    if current_setting('request.jwt.claim.role', true) = 'service_role' then
      return new;
    end if;

    if not (select public.is_admin()) then
      raise exception 'Only administrators can change profile roles';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_non_admin_profile_role_change() from public;

drop trigger if exists prevent_non_admin_profile_role_change on public.profiles;
create trigger prevent_non_admin_profile_role_change
  before update of role on public.profiles
  for each row
  execute function public.prevent_non_admin_profile_role_change();

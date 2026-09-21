-- Phase 9: secure golf score management.
-- The table is expected to exist in the project schema before this migration runs.

alter table public.golf_scores
  alter column user_id set not null,
  alter column score set not null,
  alter column score_date set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.golf_scores'::regclass
      and conname = 'golf_scores_score_range'
  ) then
    alter table public.golf_scores
      add constraint golf_scores_score_range check (score between 1 and 45);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.golf_scores'::regclass
      and conname = 'golf_scores_user_date_key'
  ) then
    alter table public.golf_scores
      add constraint golf_scores_user_date_key unique (user_id, score_date);
  end if;
end
$$;

alter table public.golf_scores enable row level security;

drop policy if exists "Users can read their own golf scores" on public.golf_scores;
create policy "Users can read their own golf scores"
  on public.golf_scores for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can update their own golf scores" on public.golf_scores;
create policy "Users can update their own golf scores"
  on public.golf_scores for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own golf scores" on public.golf_scores;
create policy "Users can delete their own golf scores"
  on public.golf_scores for delete
  to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.add_golf_score(p_score integer, p_score_date date)
returns setof public.golf_scores
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if p_score is null or p_score < 1 or p_score > 45 then
    raise exception 'Stableford score must be between 1 and 45';
  end if;

  if p_score_date is null then
    raise exception 'Score date is required';
  end if;

  insert into public.golf_scores (user_id, score, score_date)
  values (current_user_id, p_score, p_score_date);

  delete from public.golf_scores
  where user_id = current_user_id
    and id not in (
      select id
      from public.golf_scores
      where user_id = current_user_id
      order by score_date desc, created_at desc, id desc
      limit 5
    );

  return query
    select *
    from public.golf_scores
    where user_id = current_user_id
    order by score_date desc, created_at desc, id desc;
exception
  when unique_violation then
    raise exception 'A golf score already exists for this date';
end;
$$;

create or replace function public.update_golf_score(
  p_id text,
  p_score integer,
  p_score_date date
)
returns setof public.golf_scores
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if p_score is null or p_score < 1 or p_score > 45 then
    raise exception 'Stableford score must be between 1 and 45';
  end if;

  if p_score_date is null then
    raise exception 'Score date is required';
  end if;

  update public.golf_scores
  set score = p_score,
      score_date = p_score_date,
      updated_at = now()
  where id::text = p_id
    and user_id = current_user_id;

  if not found then
    raise exception 'Golf score not found';
  end if;

  delete from public.golf_scores
  where user_id = current_user_id
    and id not in (
      select id
      from public.golf_scores
      where user_id = current_user_id
      order by score_date desc, created_at desc, id desc
      limit 5
    );

  return query
    select *
    from public.golf_scores
    where user_id = current_user_id
    order by score_date desc, created_at desc, id desc;
exception
  when unique_violation then
    raise exception 'A golf score already exists for this date';
end;
$$;

revoke all on function public.add_golf_score(integer, date) from public;
grant execute on function public.add_golf_score(integer, date) to authenticated;
revoke all on function public.update_golf_score(text, integer, date) from public;
grant execute on function public.update_golf_score(text, integer, date) to authenticated;
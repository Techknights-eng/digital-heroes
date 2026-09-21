-- Phase 12: draw lifecycle, ownership, and idempotency constraints.
-- Business configuration intentionally remains unset until product rules are confirmed.

create unique index if not exists draws_draw_month_key on public.draws (draw_month);
create unique index if not exists draw_entries_draw_user_key on public.draw_entries (draw_id, user_id);
create unique index if not exists draw_results_draw_user_key on public.draw_results (draw_id, user_id);
create unique index if not exists prizes_draw_tier_key on public.prizes (draw_id, tier);

alter table public.draws enable row level security;
alter table public.draw_entries enable row level security;
alter table public.draw_results enable row level security;
alter table public.prizes enable row level security;

alter table public.draws drop constraint if exists draws_status_check;
alter table public.draws add constraint draws_status_check check (status in ('DRAFT', 'SIMULATED', 'PUBLISHED', 'COMPLETED'));

-- Public/subscriber reads are limited to published or completed draws.
drop policy if exists "Subscribers can view published draws" on public.draws;
create policy "Subscribers can view published draws"
  on public.draws for select
  to authenticated
  using (status in ('PUBLISHED', 'COMPLETED'));

drop policy if exists "Admins can manage draws" on public.draws;
create policy "Admins can manage draws"
  on public.draws for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Subscribers can view their published entries" on public.draw_entries;
create policy "Subscribers can view their published entries"
  on public.draw_entries for select
  to authenticated
  using (user_id = (select auth.uid()) and exists (select 1 from public.draws where draws.id = draw_entries.draw_id and draws.status in ('PUBLISHED', 'COMPLETED')));

drop policy if exists "Admins can manage draw entries" on public.draw_entries;
create policy "Admins can manage draw entries"
  on public.draw_entries for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Subscribers can view their published results" on public.draw_results;
create policy "Subscribers can view their published results"
  on public.draw_results for select
  to authenticated
  using (user_id = (select auth.uid()) and exists (select 1 from public.draws where draws.id = draw_results.draw_id and draws.status in ('PUBLISHED', 'COMPLETED')));

drop policy if exists "Admins can manage draw results" on public.draw_results;
create policy "Admins can manage draw results"
  on public.draw_results for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Subscribers can view published prizes" on public.prizes;
create policy "Subscribers can view published prizes"
  on public.prizes for select
  to authenticated
  using (exists (select 1 from public.draws where draws.id = prizes.draw_id and draws.status in ('PUBLISHED', 'COMPLETED')));

drop policy if exists "Admins can manage prizes" on public.prizes;
create policy "Admins can manage prizes"
  on public.prizes for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

alter table public.admin_actions enable row level security;
drop policy if exists "Admins can write audit actions" on public.admin_actions;
create policy "Admins can write audit actions"
  on public.admin_actions for insert
  to authenticated
  with check ((select public.is_admin()) and admin_id = (select auth.uid()));

drop policy if exists "Admins can read audit actions" on public.admin_actions;
create policy "Admins can read audit actions"
  on public.admin_actions for select
  to authenticated
  using ((select public.is_admin()));

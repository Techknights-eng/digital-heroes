-- Phase 13: private winner proof and payout workflow.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('winner-proofs', 'winner-proofs', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;

create unique index if not exists winner_verifications_result_user_key on public.winner_verifications (draw_result_id, user_id);
create unique index if not exists payouts_verification_key on public.payouts (winner_verification_id);

alter table public.winner_verifications enable row level security;
alter table public.payouts enable row level security;

alter table public.winner_verifications drop constraint if exists winner_verifications_status_check;
alter table public.winner_verifications add constraint winner_verifications_status_check check (status in ('PENDING', 'APPROVED', 'REJECTED'));
alter table public.payouts drop constraint if exists payouts_status_check;
alter table public.payouts add constraint payouts_status_check check (status in ('PENDING', 'PAID'));

drop policy if exists "Users can view their winner verifications" on public.winner_verifications;
create policy "Users can view their winner verifications"
  on public.winner_verifications for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Admins can manage winner verifications" on public.winner_verifications;
create policy "Admins can manage winner verifications"
  on public.winner_verifications for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Users can view their payouts" on public.payouts;
create policy "Users can view their payouts"
  on public.payouts for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Admins can manage payouts" on public.payouts;
create policy "Admins can manage payouts"
  on public.payouts for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Storage access is granted only through authenticated ownership/admin checks.
drop policy if exists "Winners can upload own proof" on storage.objects;
create policy "Winners can upload own proof" on storage.objects for insert to authenticated
with check (bucket_id = 'winner-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Winners can view own proof" on storage.objects;
create policy "Winners can view own proof" on storage.objects for select to authenticated
using (bucket_id = 'winner-proofs' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

drop policy if exists "Winners can update own proof" on storage.objects;
create policy "Winners can update own proof" on storage.objects for update to authenticated
using (bucket_id = 'winner-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'winner-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Admins can delete winner proof" on storage.objects;
create policy "Admins can delete winner proof" on storage.objects for delete to authenticated
using (bucket_id = 'winner-proofs' and (select public.is_admin()));

-- Phase 11: subscription infrastructure.
-- Existing subscription_plans.amount stores decimal rupees, so Monthly remains 100 INR.

alter table public.subscriptions
  add column if not exists provider_customer_id text;

alter table public.subscription_payments
  add column if not exists provider_event_id text;

create unique index if not exists subscription_payments_provider_event_id_key
  on public.subscription_payments (provider_event_id)
  where provider_event_id is not null;

insert into public.subscription_plans (name, billing_interval, amount, currency, is_active)
select 'Monthly', 'MONTHLY', 100, 'INR', true
where not exists (
  select 1 from public.subscription_plans
  where lower(name) = 'monthly'
    and upper(billing_interval) = 'MONTHLY'
    and amount = 100
    and upper(currency) = 'INR'
    and is_active = true
);

alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;

drop policy if exists "Public can view active subscription plans" on public.subscription_plans;
create policy "Public can view active subscription plans"
  on public.subscription_plans for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Users can view their own subscriptions" on public.subscriptions;
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Admins can manage subscriptions" on public.subscriptions;
create policy "Admins can manage subscriptions"
  on public.subscriptions for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Users can view their own subscription payments" on public.subscription_payments;
create policy "Users can view their own subscription payments"
  on public.subscription_payments for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Admins can manage subscription payments" on public.subscription_payments;
create policy "Admins can manage subscription payments"
  on public.subscription_payments for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
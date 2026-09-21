# Digital Heroes

Digital Heroes is a Vite/React subscriber experience backed by Supabase.

## Subscription test mode

The subscription flow uses Stripe Checkout in test mode. The confirmed plan is Monthly at INR 100. Yearly pricing remains TBD and is not purchasable.

Frontend variables belong in `.env` and may include:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
```

Stripe secret values must never be placed in React or `VITE_*` variables. Configure these only as Supabase Edge Function secrets:

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=http://localhost:5173
```

The Edge Functions are under `supabase/functions/`:

- `create-checkout-session` verifies the authenticated user and active database plan before creating Stripe Checkout.
- `stripe-webhook` verifies the Stripe signature and synchronizes subscriptions and payments idempotently.
- `cancel-subscription` requests cancellation at the end of the current billing period.

Apply the migrations in `supabase/migrations/` through the Supabase CLI or dashboard, deploy the functions, and configure a Stripe test webhook endpoint for `stripe-webhook`. The webhook is authoritative for subscription status; the browser success page never marks an account active.

Subscription status mapping is `active -> ACTIVE`, `past_due -> PAST_DUE`, `canceled -> CANCELLED`, and `incomplete_expired -> EXPIRED`. Other incomplete Stripe states are treated as `PAST_DUE` until the webhook provides a terminal state.

## Draw engine configuration

The draw engine supports `DRAFT -> SIMULATED -> PUBLISHED -> COMPLETED` and keeps matching/prize calculation isolated from server-side draw operations. Prize tiers are fixed at 40% for 5 matches, 35% for 4 matches, and 25% for 3 matches. Money calculations use integer minor units and split remainder units into the 5-match rollover bucket.

The following rules remain intentionally unconfigured because the PRD does not define them:

- Stableford score to draw-number transformation
- Draw-number minimum and maximum
- Prize-pool contribution percentage from active subscriptions
- Eligibility cutoff
- Jackpot rollover policy

Until those values are configured server-side, entry generation, simulation, and publication are rejected. No random number range, score transformation, revenue percentage, cutoff, or rollover policy is silently assumed.

## Winner verification and payouts

Winner proof files are stored in the private `winner-proofs` Supabase Storage bucket. Accepted types are PNG, JPEG, WEBP, and PDF up to 10 MB. The application stores an object path and generates short-lived signed URLs; it does not create public proof URLs.

Winner verification transitions are `PENDING -> APPROVED` or `PENDING -> REJECTED`. Approval creates one `PENDING` payout using the finalized prize amount. Admins can mark that payout `PAID` only after entering an external payment reference. No bank, UPI, or payout-provider transfer is initiated by this application.

## Development

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

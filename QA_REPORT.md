# Digital Heroes QA Report

Date: 2026-09-21

## 1. Executive Summary

The application builds and passes ESLint. Authentication, subscriber navigation, golf scores, charity management, subscriptions, draw boundaries, winner verification, payouts, and admin reporting are present in the repository. A profile RLS/role-integrity hardening migration and server-side proof magic-byte validation were added during this QA phase.

The most important remaining limitation is deployment: Supabase CLI and Deno are unavailable in the local environment, so migrations and Edge Functions could not be deployed or remotely compiled. Stripe checkout/webhooks, authenticated winner workflows, RLS mutation tests, and admin report execution therefore remain deployment-dependent checks rather than local passes.

## 2. PRD Compliance Checklist

| Requirement | Status | Implementation | Issue / Fix |
|---|---|---|---|
| Homepage | PASS | `src/pages/HomePage.jsx` | Live featured charity fallback is present. |
| How it works | PARTIAL | `src/routes/routeGroups.js` | Still structural placeholder. |
| Charity directory/details/events | PASS | `src/pages/Charities.jsx`, `CharityDetailsPage.jsx` | Uses active Supabase records. |
| Pricing | PASS | `src/pages/Pricing.jsx` | Monthly plan is database-backed; yearly remains unavailable. |
| Registration/login | PASS | `src/pages/Login.jsx`, `Signup.jsx`, `AuthContext.jsx` | Requires configured Supabase deployment for end-to-end proof. |
| Subscriber profile/settings | PARTIAL | `src/pages/Profile.jsx` | Read-only by design; safe editing is not implemented. |
| Subscription status/payment | PARTIAL | `src/pages/Subscription.jsx`, Edge Functions | Requires deployed Stripe functions/webhook. |
| Golf score add/edit/latest five | PASS/PARTIAL | `src/pages/Scores.jsx`, Phase 9 migration/RPC | Local UI/build pass; remote migration/RLS execution not verified. |
| Charity selection/contribution | PASS/PARTIAL | `src/pages/Charity.jsx`, Phase 10 RPC | Requires deployed migration for authenticated mutation test. |
| Draw participation | PARTIAL/TBD | `src/pages/Draws.jsx` | Published-only subscriber view exists; unresolved draw rules intentionally block generation. |
| Winnings/proof upload | PASS/PARTIAL | `src/pages/Winnings.jsx`, `winner-workflow` | Requires private bucket/migration deployment. |
| Admin users/subscriptions | PARTIAL | Existing placeholders | Read-only/admin CRUD scope remains limited. |
| Admin charities/events | PARTIAL | `AdminCharities.jsx` | Charity CRUD exists; event CRUD is not implemented. |
| Admin draw simulation/publishing | PARTIAL/TBD | `AdminDraws.jsx`, `draw-engine` | Lifecycle is guarded; unresolved rules intentionally prevent simulation. |
| Admin winner verification | PASS/PARTIAL | `AdminWinners.jsx`, `winner-workflow` | Requires deployment and test accounts. |
| Admin payouts | PASS/PARTIAL | `AdminPayouts.jsx`, `winner-workflow` | External reference only; no real transfer. |
| Admin reports/analytics | PASS/PARTIAL | `AdminReports.jsx`, `admin-reports` | Server aggregation exists; deployment and large-data performance remain unverified. |

## 3. Local Tests

- `npm run lint`: PASS.
- `npm run build`: PASS.
- Source diagnostics: PASS.
- Pure draw matching/prize assertions: PASS in prior phase.
- Frontend secret scan: PASS; no service-role or Stripe secret references in `src`.
- Unauthenticated protected-route smoke checks: PASS for subscriber/admin routes tested.
- Browser console: stale Vite HMR 404/500 entries occurred while replacing files; clean production builds passed afterward. A fresh dev-server restart is recommended for browser QA.

## 4. Authentication/Profile

| Check | Status | Notes |
|---|---|---|
| Signup/login/logout/session persistence | PARTIAL | Implemented; requires Supabase account/session. |
| Missing profile handling | PASS | Auth context redirects with a user-facing error. |
| Subscriber/admin separation | PASS/PARTIAL | `ProtectedRoute` plus database admin checks in Edge Functions. Deployment RLS test pending. |
| Role escalation prevention | FIXED/PENDING DEPLOYMENT | `supabase/migrations/202609210006_qa_hardening.sql` protects `profiles.role` from subscriber updates. |

## 5. Golf Scores

Implemented client and server validation for 1-45, duplicate dates, editing, newest-first display, and server-side rolling-five logic. Remote RLS/RPC test cases require applying the Phase 9 migration and authenticated users.

## 6. Charity

Public active-only directory/detail/event reads, subscriber selection, 10-100% contribution UI/RPC, admin charity CRUD, and featured fallback are implemented. Historical amount analytics correctly use stored amounts only. The contribution-history model remains intentionally conservative: selection updates the latest contribution row.

## 7. Subscription/Payments

Monthly plan is ₹100/month using the existing decimal-rupee database convention. Yearly remains TBD. Checkout, customer reuse, webhook signature verification, subscription status mapping, cancellation-at-period-end, and payment idempotency are implemented in Edge Functions. Stripe test checkout/webhook execution is not locally available.

## 8. Draws

Draw status constraints and unique draw/entry/result/prize indexes are defined in `202609210004_draws.sql`. Matching and prize percentages are isolated in `src/services/draws/`. The following remain explicitly unconfigured and correctly block sensitive operations:

- Stableford to draw-number transformation
- Draw-number range
- Prize-pool contribution percentage
- Eligibility cutoff
- Jackpot rollover policy

The fixed tier split remains 40% / 35% / 25%.

## 9. Winner Verification/Payouts

Private `winner-proofs` bucket policy, owner/admin access, signed URLs, winner-only server verification, PENDING/APPROVED/REJECTED review flow, payout creation from finalized prize amount, and PENDING/PAID transition with external payment reference are implemented. Server-side proof validation now checks MIME type and file magic bytes. Deployment and cross-user storage tests remain pending.

## 10. RLS/Security Audit

| Table/resource | Public | Subscriber | Admin |
|---|---|---|---|
| `profiles` | None | Own select/update excluding role | Full management through role policy |
| `subscription_plans` | Active select | Active select | Admin access per migration |
| `subscriptions` | None | Own select | Admin select/manage |
| `subscription_payments` | None | Own select | Admin select/manage |
| `charities` | Active select | Active select | Admin manage |
| `charity_events` | Events for active charities | Same | Admin manage |
| `charity_contributions` | None | Own select | Admin select/manage |
| `golf_scores` | None | Own access | Existing policy scope |
| `draws` | None | Published/completed select | Admin manage |
| `draw_entries/results` | None | Own published select | Admin manage |
| `prizes` | None | Published/completed select | Admin manage |
| `winner_verifications` | None | Own select | Admin manage |
| `payouts` | None | Own select | Admin manage |
| `admin_actions` | None | None | Admin insert/select |
| `winner-proofs` storage | None | Own path | Admin review/delete |

This table reflects repository migrations; remote policy state must be verified after migrations are applied. No intentional `USING (true)` private-data policy was found in repository migrations.

## 11. Bugs Fixed During QA

1. Added profile RLS and subscriber role immutability migration.
2. Added proof file magic-byte validation to prevent MIME-only bypasses.
3. Verified frontend builds/lints after the fixes.

## 12. Remaining Issues

1. Supabase migrations and Edge Functions are not deployed from this environment because Supabase CLI/Deno are unavailable.
2. Authenticated end-to-end tests require real test accounts and deployed functions.
3. Existing pages for how-it-works, users, and subscriptions admin management remain placeholders or limited management views.
4. Admin report aggregation is bounded to 1,000 rows per source query; database aggregate views/pagination should be added before high-volume production use.
5. Some optional report filters are UI-limited; date, subscription status, and payout status are implemented, while charity/draw selectors require populated option datasets.
6. A fresh dev-server restart is recommended after extensive HMR file replacement before browser QA.

## 13. Explicit TBD Business Rules

- Yearly subscription price.
- Prize-pool contribution percentage.
- Stableford-to-draw-number transformation.
- Draw-number range.
- Draw eligibility cutoff.
- Jackpot rollover policy.
- Real payout provider integration.

No real payout transfer is performed, and no unresolved business rule was silently invented.

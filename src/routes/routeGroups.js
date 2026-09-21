export const publicRoutes = [
  {
    path: 'how-it-works',
    title: 'How It Works',
    description: 'Subscription, charity contribution, score entry, and monthly draw mechanics will be explained here.',
  },
]

export const dashboardRoutes = [
  {
    path: 'subscription',
    title: 'Subscription',
    description: 'View your subscription status and payment history.',
  },
  {
    path: 'scores',
    title: 'Scores',
    description: 'Subscribers will enter Stableford scores here. Validation and retention rules will live outside the UI.',
  },
  {
    path: 'charity',
    title: 'Selected Charity',
    description: 'Subscribers will choose the charity attached to their subscription contribution here.',
  },
  {
    path: 'draws',
    title: 'Draws',
    description: 'Subscriber draw history and entries will appear here after eligibility rules are finalized.',
  },
  {
    path: 'winnings',
    title: 'Winnings',
    description: 'Winner proof upload and verification status will appear here after auth and storage are implemented.',
  },
  {
    path: 'profile',
    title: 'Profile',
    description: 'Profile and settings management will appear here after authentication is implemented.',
  },
]

export const adminRoutes = [
  {
    path: 'users',
    title: 'Users',
    description: 'Admin user management will be implemented behind trusted server-side authorization.',
  },
  {
    path: 'subscriptions',
    title: 'Subscriptions',
    description: 'Admin subscription and payment status views will be backed by Supabase policies and server logic.',
  },
  {
    path: 'charities',
    title: 'Charities',
    description: 'Admin charity management will use verified database records, not browser-supplied trust.',
  },
  {
    path: 'draws',
    title: 'Draws',
    description: 'Simulation and publishing controls will be implemented after draw rules are finalized.',
  },
  {
    path: 'winners',
    title: 'Winners',
    description: 'Winner verification workflows will appear here once proof upload and admin review are built.',
  },
  {
    path: 'payouts',
    title: 'Payouts',
    description: 'Payout tracking will appear here after payout status rules are finalized.',
  },
  {
    path: 'reports',
    title: 'Reports',
    description: 'Operational reporting will be added after live data access patterns are agreed.',
  },
]

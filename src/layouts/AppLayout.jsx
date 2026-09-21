import { HeartHandshake, ShieldCheck, Trophy } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const publicNavItems = [
  { to: '/', label: 'Home' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/charities', label: 'Charities' },
  { to: '/pricing', label: 'Pricing' },
]

function AppLayout() {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-forest text-white">
              <HeartHandshake size={21} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-semibold leading-tight text-ink">Digital Heroes</span>
              <span className="block text-xs font-medium text-muted">Golf performance for impact</span>
            </span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Public navigation">
            {publicNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-md px-3 py-2 text-sm font-medium transition',
                    isActive ? 'bg-mint text-forest' : 'text-muted hover:bg-white hover:text-ink',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <NavLink
              to="/login"
              className="rounded-md px-3 py-2 text-sm font-semibold text-muted transition hover:bg-white hover:text-ink"
            >
              Login
            </NavLink>
            <NavLink
              to="/signup"
              className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink"
            >
              Sign up
            </NavLink>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <NavLink
              to="/login"
              className="rounded-md px-3 py-2 text-sm font-semibold text-muted transition hover:bg-white hover:text-ink"
            >
              Login
            </NavLink>
            <NavLink
              to="/signup"
              className="rounded-md bg-forest px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink"
            >
              Join
            </NavLink>
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6 md:hidden"
          aria-label="Public navigation"
        >
          {publicNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-mint text-forest' : 'text-muted hover:bg-white hover:text-ink',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-muted sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="flex items-start gap-3">
            <HeartHandshake className="mt-0.5 text-forest" size={20} aria-hidden="true" />
            <p>Minimum charity contribution: 10% of subscription fee.</p>
          </div>
          <div className="flex items-start gap-3">
            <Trophy className="mt-0.5 text-gold" size={20} aria-hidden="true" />
            <p>Prize pool allocation, score-to-number logic, and draw range remain configurable.</p>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 text-coral" size={20} aria-hidden="true" />
            <p>Roles, payment state, eligibility, and winner verification will be trusted server-side only.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AppLayout

import { Menu, X, LogOut, UserRound } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { dashboardRoutes } from '../routes/routeGroups.js'
import { useAuth } from '../context/AuthContextValue.js'

function DashboardLayout() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const displayName = profile?.full_name || user?.email || 'Subscriber'

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(error.message)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5 flex items-center justify-between lg:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Subscriber area</p>
          <p className="mt-1 font-semibold text-ink">Your impact dashboard</p>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center rounded-md border border-line bg-white text-ink" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen}>
          {menuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className={`${menuOpen ? 'block' : 'hidden'} rounded-md border border-line bg-white p-3 lg:block`}>
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">Subscriber</p>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Dashboard navigation">
            <DashboardLink to="/dashboard" end label="Dashboard" icon={UserRound} onNavigate={() => setMenuOpen(false)} />
            {dashboardRoutes.map((route) => (
              <DashboardLink key={route.path} to={`/dashboard/${route.path}`} label={route.title} onNavigate={() => setMenuOpen(false)} />
            ))}
          </nav>
          <div className="mt-5 border-t border-line pt-4">
            <div className="flex items-center gap-3 px-3">
              <span className="grid size-9 place-items-center rounded-full bg-mint text-sm font-semibold text-forest">{displayName.charAt(0).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                <p className="truncate text-xs text-muted">Subscriber account</p>
              </div>
            </div>
            {logoutError && <p className="mt-3 px-3 text-xs leading-5 text-coral">{logoutError}</p>}
            <button onClick={handleSignOut} className="mt-3 inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-paper hover:text-coral">
              <LogOut size={17} aria-hidden="true" />
              Log out
            </button>
          </div>
        </aside>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </section>
  )
}

function DashboardLink({ to, label, end = false, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition',
          isActive ? 'bg-mint text-forest' : 'text-muted hover:bg-paper hover:text-ink',
        ].join(' ')
      }
    >
      {Icon && <Icon size={17} aria-hidden="true" />}
      {label}
    </NavLink>
  )
}

export default DashboardLayout

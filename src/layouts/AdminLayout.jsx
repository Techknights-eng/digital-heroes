import { NavLink, Outlet } from 'react-router-dom'
import { adminRoutes } from '../routes/routeGroups.js'

function AdminLayout() {
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
      <aside className="rounded-md border border-line bg-white p-3">
        <p className="px-3 py-2 text-xs font-semibold uppercase text-muted">Admin</p>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Admin navigation">
          <AdminLink to="/admin" end label="Overview" />
          {adminRoutes.map((route) => (
            <AdminLink key={route.path} to={`/admin/${route.path}`} label={route.title} />
          ))}
        </nav>
      </aside>
      <Outlet />
    </section>
  )
}

function AdminLink({ to, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition',
          isActive ? 'bg-ink text-white' : 'text-muted hover:bg-paper hover:text-ink',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  )
}

export default AdminLayout

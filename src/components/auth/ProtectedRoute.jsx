import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContextValue.js'

function ProtectedRoute({ adminOnly = false }) {
  const { loading, isAuthenticated, isAdmin, profileError } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="grid min-h-[50vh] place-items-center p-8 text-sm text-muted">Checking your session...</div>
  }

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (profileError) return <Navigate to="/login" replace state={{ error: profileError }} />
  if (adminOnly && !isAdmin) return <Navigate to="/unauthorized" replace />

  return <Outlet />
}

export default ProtectedRoute
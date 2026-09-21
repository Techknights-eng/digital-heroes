import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import HomePage from './pages/HomePage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Scores from './pages/Scores.jsx'
import Charity from './pages/Charity.jsx'
import Draws from './pages/Draws.jsx'
import Winnings from './pages/Winnings.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Unauthorized from './pages/Unauthorized.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminCharities from './pages/admin/AdminCharities.jsx'
import AdminDraws from './pages/admin/AdminDraws.jsx'
import AdminDrawDetail from './pages/admin/AdminDrawDetail.jsx'
import AdminWinners from './pages/admin/AdminWinners.jsx'
import AdminPayouts from './pages/admin/AdminPayouts.jsx'
import AdminReports from './pages/admin/AdminReports.jsx'
import Charities from './pages/Charities.jsx'
import CharityDetailsPage from './pages/CharityDetailsPage.jsx'
import Pricing from './pages/Pricing.jsx'
import Subscription from './pages/Subscription.jsx'
import SubscriptionResult from './pages/SubscriptionResult.jsx'
import { adminRoutes, publicRoutes } from './routes/routeGroups.js'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="charities" element={<Charities />} />
          <Route path="charities/:id" element={<CharityDetailsPage />} />
          <Route path="pricing" element={<Pricing />} />
          {publicRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  <PlaceholderPage {...route} />
                </div>
              }
            />
          ))}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="subscription" element={<Subscription />} />
              <Route path="scores" element={<Scores />} />
              <Route path="charity" element={<Charity />} />
              <Route path="draws" element={<Draws />} />
              <Route path="winnings" element={<Winnings />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute adminOnly />}>
              <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="charities" element={<AdminCharities />} />
              <Route path="draws" element={<AdminDraws />} />
              <Route path="draws/:id" element={<AdminDrawDetail />} />
              <Route path="winners" element={<AdminWinners />} />
              <Route path="payouts" element={<AdminPayouts />} />
              <Route path="reports" element={<AdminReports />} />
              {adminRoutes.filter((route) => !['users', 'charities', 'draws', 'winners', 'payouts', 'reports'].includes(route.path)).map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<PlaceholderPage {...route} section="Admin" />}
                />
              ))}
            </Route>
          </Route>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="subscription/success" element={<SubscriptionResult />} />
          <Route path="subscription/cancelled" element={<SubscriptionResult cancelled />} />
          <Route path="unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

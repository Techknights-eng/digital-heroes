import { UserRound } from 'lucide-react'
import DashboardCard from '../components/dashboard/DashboardCard.jsx'
import { useAuth } from '../context/AuthContextValue.js'

function Profile() {
  const { profile, user } = useAuth()
  const fields = [
    ['Full name', profile?.full_name || 'Not provided'],
    ['Email', user?.email || 'Not available'],
    ['Phone', profile?.phone || 'Not provided'],
    ['Account role', profile?.role || 'Subscriber'],
  ]

  return (
    <div className="space-y-6">
      <header><p className="text-sm font-semibold text-forest">Account settings</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Profile</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Review the account details currently available to your Digital Heroes profile.</p></header>
      <DashboardCard icon={UserRound} eyebrow="Account information" title="Your details" description="Profile editing will be enabled only when supported safely by the database policies.">
        <div className="grid gap-5 sm:grid-cols-2">{fields.map(([label, value]) => <label key={label} className="block text-sm font-medium text-ink"><span className="mb-2 block">{label}</span><input readOnly value={value} className="w-full rounded-md border border-line bg-paper px-3 py-3 text-sm text-muted outline-none" /></label>)}</div>
        <p className="mt-5 rounded-md bg-mint p-3 text-sm leading-6 text-forest">These fields are read-only for now. Your account role cannot be changed from the subscriber interface.</p>
      </DashboardCard>
    </div>
  )
}

export default Profile
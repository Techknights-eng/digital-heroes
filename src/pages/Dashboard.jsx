import { CalendarClock, CircleDollarSign, HeartHandshake, Trophy, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardCard from '../components/dashboard/DashboardCard.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import { useAuth } from '../context/AuthContextValue.js'
import { getGolfScores } from '../services/golfScores.js'
import { getMyCharityContribution } from '../services/charities.js'
import { formatPlanAmount, formatSubscriptionDate, getMySubscription, getSubscriptionStatus } from '../services/subscriptions.js'
import { getMyWinnings } from '../services/winnerWorkflow.js'

function Dashboard() {
  const { profile } = useAuth()
  const displayName = profile?.full_name || 'Hero'
  const [scores, setScores] = useState([])
  const [scoresLoading, setScoresLoading] = useState(true)
  const [scoresError, setScoresError] = useState(false)
  const [charityContribution, setCharityContribution] = useState(null)
  const [charityLoading, setCharityLoading] = useState(true)
  const [charityError, setCharityError] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState(false)
  const [winnings, setWinnings] = useState([])
  const [winningsLoading, setWinningsLoading] = useState(true)
  const [winningsError, setWinningsError] = useState(false)

  useEffect(() => {
    let active = true
    getGolfScores()
      .then((data) => {
        if (active) setScores(data)
      })
      .catch(() => {
        if (active) setScoresError(true)
      })
      .finally(() => {
        if (active) setScoresLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    getMyWinnings().then((data) => {
      if (active) setWinnings(data)
    }).catch(() => {
      if (active) setWinningsError(true)
    }).finally(() => {
      if (active) setWinningsLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    getMySubscription().then((data) => {
      if (active) setSubscription(data)
    }).catch(() => {
      if (active) setSubscriptionError(true)
    }).finally(() => {
      if (active) setSubscriptionLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    getMyCharityContribution().then((data) => {
      if (active) setCharityContribution(data)
    }).catch(() => {
      if (active) setCharityError(true)
    }).finally(() => {
      if (active) setCharityLoading(false)
    })
    return () => { active = false }
  }, [])

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-forest">Subscriber dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Welcome back, {displayName}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">Your place to stay close to your play, your impact, and what comes next.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard icon={CircleDollarSign} eyebrow="Subscription" title="Membership status">
          {subscriptionLoading && <p className="text-sm text-muted">Loading your subscription...</p>}
          {!subscriptionLoading && subscriptionError && <p className="text-sm leading-6 text-muted">Unable to load your subscription. Please try again from the subscription page.</p>}
          {!subscriptionLoading && !subscriptionError && <><div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3"><StatCard label="Status" value={getSubscriptionStatus(subscription)} /><StatCard label="Plan" value={subscription?.subscription_plans?.name || 'No active plan'} /><StatCard label="Renewal" value={formatSubscriptionDate(subscription?.current_period_end)} detail={subscription?.amount ? formatPlanAmount(subscription.amount, subscription.currency) : 'No active subscription'} /></div><Link to={subscription ? '/dashboard/subscription' : '/pricing'} className="mt-4 inline-flex rounded-md bg-forest px-3 py-2 text-sm font-semibold text-white hover:bg-ink">{subscription ? 'Manage subscription' : 'View pricing'}</Link></>}
        </DashboardCard>

        <DashboardCard icon={Trophy} eyebrow="Golf scores" title="Your latest scores">
          {scoresLoading && <p className="text-sm text-muted">Loading your scores...</p>}
          {!scoresLoading && scoresError && <p className="text-sm leading-6 text-muted">Unable to load your golf scores. Please try again from the scores page.</p>}
          {!scoresLoading && !scoresError && <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2"><StatCard label="Latest score" value={scores[0]?.score ?? 'No scores yet'} detail={scores[0] ? formatScoreDate(scores[0].score_date) : 'Add your first score to get started.'} /><StatCard label="Stored scores" value={`${scores.length} / 5`} detail="Latest five retained" /></div>}
          <Link to="/dashboard/scores" className="mt-4 inline-flex rounded-md bg-forest px-3 py-2 text-sm font-semibold text-white hover:bg-ink">Manage scores</Link>
        </DashboardCard>

        <DashboardCard icon={HeartHandshake} eyebrow="Charity" title="Your selected charity">
          {charityLoading && <p className="text-sm text-muted">Loading your charity selection...</p>}
          {!charityLoading && charityError && <p className="text-sm leading-6 text-muted">Unable to load your charity selection. Please try again from the charity page.</p>}
          {!charityLoading && !charityError && <StatCard label="Selected charity" value={charityContribution?.charities?.name || 'No charity selected'} detail={charityContribution ? `Contribution: ${charityContribution.percentage}%` : 'Choose a charity to get started.'} />}
          <Link to="/dashboard/charity" className="mt-4 inline-flex rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-forest hover:text-forest">View charity</Link>
        </DashboardCard>

        <DashboardCard icon={CalendarClock} eyebrow="Draws" title="Draw participation">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            <StatCard label="Next draw" value="Coming soon" />
            <StatCard label="Participation" value="Not available" />
          </div>
          <Link to="/dashboard/draws" className="mt-4 inline-flex rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-forest hover:text-forest">View draws</Link>
        </DashboardCard>

        <DashboardCard icon={CircleDollarSign} eyebrow="Winnings" title="Your winnings">
          {winningsLoading && <p className="text-sm text-muted">Loading your winnings...</p>}
          {!winningsLoading && winningsError && <p className="text-sm leading-6 text-muted">Unable to load your winnings. Please try again from the winnings page.</p>}
          {!winningsLoading && !winningsError && <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2"><StatCard label="Qualifying results" value={winnings.length} /><StatCard label="Latest status" value={getLatestWinningsStatus(winnings)} /></div>}
          <Link to="/dashboard/winnings" className="mt-4 inline-flex rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-forest hover:text-forest">View winnings</Link>
        </DashboardCard>

        <DashboardCard icon={UsersRound} eyebrow="Profile" title="Account details" description="Keep your account information ready for future subscriber features.">
          <Link to="/dashboard/profile" className="inline-flex rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-forest hover:text-forest">View profile</Link>
        </DashboardCard>
      </div>
    </div>
  )
}

function formatScoreDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

function getLatestWinningsStatus(winnings) {
  const latest = winnings[0]
  if (!latest) return 'No winnings yet'
  if (latest.payouts?.[0]?.status === 'PAID') return 'Paid'
  if (latest.winner_verifications?.[0]?.status === 'APPROVED') return 'Verified - payout pending'
  if (latest.winner_verifications?.[0]?.status === 'PENDING') return 'Verification pending'
  return 'Proof required'
}

export default Dashboard
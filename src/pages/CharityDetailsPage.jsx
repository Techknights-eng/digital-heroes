import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CharityDetails from '../components/charity/CharityDetails.jsx'
import CharityEvents from '../components/charity/CharityEvents.jsx'
import EmptyState from '../components/dashboard/EmptyState.jsx'
import ErrorState from '../components/dashboard/ErrorState.jsx'
import LoadingState from '../components/dashboard/LoadingState.jsx'
import { getCharityById, getCharityEvents } from '../services/charities.js'

function CharityDetailsPage() {
  const { id } = useParams()
  const [charity, setCharity] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getCharityById(id), getCharityEvents(id)]).then(([charityData, eventData]) => {
      if (!active) return
      setCharity(charityData)
      setEvents(eventData)
    }).catch((loadError) => {
      if (active) setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [id])

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><LoadingState label="Loading charity details" /></div>
  if (error) return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8"><ErrorState title="Unable to load charity details" description="Please try again shortly." /></div>
  if (!charity) return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8"><EmptyState title="Charity not found" description="This charity is unavailable or no longer active." action={<Link to="/charities" className="inline-flex rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white">Back to charities</Link>} /></div>

  return <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8"><CharityDetails charity={charity} /><section><h2 className="text-2xl font-semibold text-ink">Upcoming events</h2><div className="mt-4"><CharityEvents events={events} /></div></section></div>
}

export default CharityDetailsPage
import { Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import CharityList from '../components/charity/CharityList.jsx'
import EmptyState from '../components/dashboard/EmptyState.jsx'
import ErrorState from '../components/dashboard/ErrorState.jsx'
import LoadingState from '../components/dashboard/LoadingState.jsx'
import { getActiveCharities } from '../services/charities.js'

function Charities() {
  const [charities, setCharities] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadCharities(filters = { search, featuredOnly }) {
    setLoading(true)
    setError('')
    try {
      setCharities(await getActiveCharities(filters))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getActiveCharities().then((data) => {
      if (active) setCharities(data)
    }).catch((loadError) => {
      if (active) setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    setSearch(searchInput)
    void loadCharities({ search: searchInput, featuredOnly })
  }

  function toggleFeatured(event) {
    const nextFeaturedOnly = event.target.checked
    setFeaturedOnly(nextFeaturedOnly)
    void loadCharities({ search, featuredOnly: nextFeaturedOnly })
  }

  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><header><p className="text-sm font-semibold text-forest">Charity directory</p><h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">Find a cause worth backing</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Explore active charities and learn more about the work your subscription can support.</p></header><form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Search charities</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} aria-hidden="true" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by charity name" className="w-full rounded-md border border-line bg-white py-3 pl-10 pr-3 outline-none focus:border-forest focus:ring-2 focus:ring-mint" /></label><button className="inline-flex items-center justify-center gap-2 rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white hover:bg-ink"><Search size={17} aria-hidden="true" />Search</button><label className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-3 text-sm font-medium text-ink"><input type="checkbox" checked={featuredOnly} onChange={toggleFeatured} className="accent-forest" /><SlidersHorizontal size={16} aria-hidden="true" />Featured only</label></form><div className="mt-8">{loading && <LoadingState label="Loading charities" />}{!loading && error && <ErrorState title="Unable to load charities" description="Please try again shortly." onRetry={() => loadCharities()} />}{!loading && !error && charities.length === 0 && <EmptyState title="No charities available" description="There are no active charities matching your search right now." />}{!loading && !error && charities.length > 0 && <CharityList charities={charities} />}</div></div>
}

export default Charities
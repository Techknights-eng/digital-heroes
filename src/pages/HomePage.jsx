import { ArrowRight, CircleDollarSign, HeartHandshake, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CharityList from '../components/charity/CharityList.jsx'
import { getActiveCharities } from '../services/charities.js'

const facts = [
  {
    icon: CircleDollarSign,
    label: 'Subscription',
    value: 'INR 100 monthly',
    detail: 'Yearly pricing remains TBD.',
  },
  {
    icon: HeartHandshake,
    label: 'Charity',
    value: 'Minimum 10%',
    detail: 'Every subscription includes a configurable charity contribution.',
  },
  {
    icon: Trophy,
    label: 'Draw',
    value: 'Monthly',
    detail: 'Random and algorithmic modes are planned after rules are finalized.',
  },
]

function HomePage() {
  const [featuredCharities, setFeaturedCharities] = useState([])
  const [featuredLoading, setFeaturedLoading] = useState(true)

  useEffect(() => {
    let active = true
    getActiveCharities({ featuredOnly: true }).then((data) => {
      if (active) setFeaturedCharities(data)
    }).catch(() => {
      if (active) setFeaturedCharities([])
    }).finally(() => {
      if (active) setFeaturedLoading(false)
    })
    return () => { active = false }
  }, [])

  return (
    <>
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-16">
      <div className="flex flex-col justify-center">
        <p className="mb-4 w-fit rounded-md border border-line bg-white px-3 py-1 text-sm font-semibold text-forest">
          Subscription golf, built around measurable giving
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl lg:text-6xl">
          Digital Heroes turns monthly play into charity impact and fair draw participation.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
          This first build establishes the application structure only: public discovery, subscriber areas,
          admin workspaces, and a Supabase-ready service boundary.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/how-it-works"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink"
          >
            Explore mechanics
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link
            to="/charities"
            className="inline-flex items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-forest hover:text-forest"
          >
            View charities
          </Link>
        </div>
      </div>

      <div className="grid content-start gap-4">
        {facts.map((fact) => {
          const Icon = fact.icon

          return (
            <article key={fact.label} className="rounded-md border border-line bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-mint text-forest">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-muted">{fact.label}</p>
                  <h2 className="mt-1 text-2xl font-semibold text-ink">{fact.value}</h2>
                  <p className="mt-2 leading-7 text-muted">{fact.detail}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
    <section className="border-t border-line bg-white"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm font-semibold text-forest">Featured charity</p><h2 className="mt-2 text-3xl font-semibold text-ink">Causes in focus</h2>{featuredLoading && <p className="mt-3 text-sm text-muted">Loading featured charities...</p>}{!featuredLoading && featuredCharities.length === 0 && <p className="mt-3 text-sm text-muted">No featured charity at the moment.</p>}{!featuredLoading && featuredCharities.length > 0 && <div className="mt-5"><CharityList charities={featuredCharities} /></div>}</div></section>
    </>
  )
}

export default HomePage

import { Construction, Database, Info } from 'lucide-react'

function PlaceholderPage({ title, description, section = 'Public' }) {
  return (
    <section className="w-full rounded-md border border-line bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-md bg-mint px-3 py-1 text-sm font-semibold text-forest">
            <Construction size={16} aria-hidden="true" />
            {section} placeholder
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted">{description}</p>
        </div>
        <div className="rounded-md border border-line bg-paper p-4 text-sm text-muted lg:max-w-xs">
          <div className="flex gap-3">
            <Info className="mt-0.5 shrink-0 text-gold" size={18} aria-hidden="true" />
            <p>This page is intentionally structural only. No authentication, payments, or draw engine logic has been added.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StateTile title="Loading state" body="Reserved for live Supabase requests." />
        <StateTile title="Empty state" body="Will be shown when a table has no records." />
        <StateTile title="Error state" body="Will surface recoverable data or permission failures." />
      </div>
    </section>
  )
}

function StateTile({ title, body }) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <Database className="text-coral" size={18} aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  )
}

export default PlaceholderPage

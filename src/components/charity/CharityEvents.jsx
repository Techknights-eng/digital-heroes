import { CalendarDays } from 'lucide-react'
import EmptyState from '../dashboard/EmptyState.jsx'

function CharityEvents({ events }) {
  if (!events.length) return <EmptyState title="No upcoming events." description="Upcoming charity events will appear here when they are available." />
  return <div className="space-y-3">{events.map((event) => <article key={event.id} className="rounded-md border border-line bg-paper p-4"><div className="flex gap-3">{event.image_url && <img src={event.image_url} alt="" className="size-16 rounded-md object-cover" />}<div><p className="flex items-center gap-2 text-sm font-semibold text-forest"><CalendarDays size={16} aria-hidden="true" />{formatDate(event.event_date)}</p><h3 className="mt-1 font-semibold text-ink">{event.title}</h3>{event.location && <p className="mt-1 text-sm text-muted">{event.location}</p>}<p className="mt-2 text-sm leading-6 text-muted">{event.description || 'Event details coming soon.'}</p></div></div></article>)}</div>
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

export default CharityEvents
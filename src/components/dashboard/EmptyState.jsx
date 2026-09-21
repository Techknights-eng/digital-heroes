import { Inbox } from 'lucide-react'

function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-paper p-6 text-center">
      <Inbox className="mx-auto text-muted" size={24} aria-hidden="true" />
      <h3 className="mt-3 text-base font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
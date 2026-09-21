function DashboardCard({ icon: Icon, eyebrow, title, description, action, children, className = '' }) {
  return (
    <article className={`rounded-md border border-line bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-mint text-forest">
              <Icon size={19} aria-hidden="true" />
            </span>
          )}
          <div>
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-wide text-muted">{eyebrow}</p>}
            <h2 className="mt-1 text-lg font-semibold text-ink">{title}</h2>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children || <p className="text-sm leading-6 text-muted">{description}</p>}</div>
    </article>
  )
}

export default DashboardCard
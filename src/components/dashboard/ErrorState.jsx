import { AlertCircle } from 'lucide-react'

function ErrorState({ title = 'Something went wrong', description = 'We could not load this area right now.', onRetry }) {
  return (
    <div className="rounded-md border border-coral/30 bg-coral/10 p-6" role="alert">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 shrink-0 text-coral" size={20} aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
          {onRetry && <button onClick={onRetry} className="mt-4 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-forest hover:text-forest">Try again</button>}
        </div>
      </div>
    </div>
  )
}

export default ErrorState
function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="space-y-3 rounded-md border border-line bg-white p-6" role="status" aria-live="polite">
      <span className="block h-4 w-32 animate-pulse rounded bg-line" />
      <span className="block h-4 w-full animate-pulse rounded bg-line/70" />
      <span className="block h-4 w-2/3 animate-pulse rounded bg-line/70" />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export default LoadingState
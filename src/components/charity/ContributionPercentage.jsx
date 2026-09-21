function ContributionPercentage({ value, onChange, disabled = false }) {
  return <label className="block text-sm font-medium text-ink"><span className="flex items-center justify-between"><span>Contribution to charity</span><strong className="text-forest">{value}%</strong></span><input className="mt-3 w-full accent-forest" type="range" min="10" max="100" step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} disabled={disabled} /><span className="mt-1 block text-xs text-muted">Minimum contribution: 10%</span></label>
}

export default ContributionPercentage
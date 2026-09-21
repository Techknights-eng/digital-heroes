import { ExternalLink, Star } from 'lucide-react'

function CharityDetails({ charity }) {
  return <div className="overflow-hidden rounded-md border border-line bg-white shadow-sm"><div className="aspect-[16/6] bg-paper">{charity.image_url ? <img src={charity.image_url} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-sm text-muted">No image available</div>}</div><div className="p-6 sm:p-8">{charity.is_featured && <p className="inline-flex items-center gap-1 rounded-md bg-mint px-2 py-1 text-xs font-semibold text-forest"><Star size={13} aria-hidden="true" />Featured charity</p>}<h1 className="mt-3 text-3xl font-semibold text-ink">{charity.name}</h1><p className="mt-4 max-w-3xl whitespace-pre-line leading-7 text-muted">{charity.description || 'Charity description coming soon.'}</p>{charity.website_url && <a href={charity.website_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-ink">Visit website <ExternalLink size={16} aria-hidden="true" /></a>}</div></div>
}

export default CharityDetails
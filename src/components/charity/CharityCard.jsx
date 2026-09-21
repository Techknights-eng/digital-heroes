import { ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

function CharityCard({ charity, selectable = false }) {
  return <article className="flex h-full flex-col overflow-hidden rounded-md border border-line bg-white text-left shadow-sm"><div className="aspect-[16/8] bg-paper">{charity.image_url ? <img src={charity.image_url} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-sm text-muted">No image available</div>}</div><div className="flex flex-1 flex-col p-5">{charity.is_featured && <p className="inline-flex w-fit items-center gap-1 rounded-md bg-mint px-2 py-1 text-xs font-semibold text-forest"><Star size={13} aria-hidden="true" />Featured</p>}<h2 className="mt-3 text-xl font-semibold text-ink">{charity.name}</h2><p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted">{charity.description || 'Charity description coming soon.'}</p>{!selectable && <Link to={`/charities/${charity.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-ink">View details <ArrowRight size={16} aria-hidden="true" /></Link>}</div></article>
}

export default CharityCard
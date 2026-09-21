import CharityCard from './CharityCard.jsx'

function CharitySelector({ charities, selectedId, onSelect }) {
  return <div className="grid gap-4 sm:grid-cols-2">{charities.map((charity) => <button key={charity.id} type="button" onClick={() => onSelect(charity.id)} className={`rounded-md text-left ${selectedId === charity.id ? 'outline outline-2 outline-forest' : ''}`}><CharityCard charity={charity} selectable /></button>)}</div>
}

export default CharitySelector
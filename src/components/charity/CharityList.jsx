import CharityCard from './CharityCard.jsx'

function CharityList({ charities }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{charities.map((charity) => <CharityCard key={charity.id} charity={charity} />)}</div>
}

export default CharityList
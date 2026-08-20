import { useState } from 'react'
import ComparisonChart from '../components/ComparisonChart.jsx'
import CardTabs from '../components/CardTabs.jsx'
import CardDetail from '../components/CardDetail.jsx'
import './ComparePage.css'

const MAX_SELECTED = 4

export default function ComparePage({ cards }) {
  const [selectedIds, setSelectedIds] = useState([cards[0]?.id, cards[2]?.id].filter(Boolean))
  const [activeId, setActiveId] = useState(null)

  const selectedCards = cards.filter((c) => selectedIds.includes(c.id))
  const activeCard = selectedCards.find((c) => c.id === activeId) ?? selectedCards[0]

  function toggle(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_SELECTED) return prev
      return [...prev, id]
    })
  }

  return (
    <main className="page">
      <header className="compare-intro">
        <p className="eyebrow">Cross-issuer</p>
        <h1>Compare any cards</h1>
        <p className="lede">Pick up to {MAX_SELECTED} cards from any issuer to compare.</p>
      </header>

      <div className="picker">
        {cards.map((c) => {
          const checked = selectedIds.includes(c.id)
          const disabled = !checked && selectedIds.length >= MAX_SELECTED
          return (
            <label key={c.id} className={`picker-item${disabled ? ' disabled' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(c.id)}
              />
              <span>
                {c.name}
                <em>{c.issuer}</em>
              </span>
            </label>
          )
        })}
      </div>

      {selectedCards.length >= 2 && (
        <>
          <ComparisonChart cards={selectedCards} />
          <CardTabs cards={selectedCards} activeId={activeCard?.id} onSelect={setActiveId} />
        </>
      )}

      {selectedCards.length === 1 && <p className="single-card-note">Pick at least one more card to compare.</p>}
      {selectedCards.length === 0 && <p className="single-card-note">Select cards above to compare them.</p>}

      {activeCard && selectedCards.length >= 1 && <CardDetail card={activeCard} />}
    </main>
  )
}

import { useState, useMemo } from 'react'
import ComparisonChart from '../components/ComparisonChart.jsx'
import CardTabs from '../components/CardTabs.jsx'
import CardDetail from '../components/CardDetail.jsx'
import './IssuerPage.css'

export default function IssuerPage({ cards, issuer }) {
  const issuerCards = useMemo(
    () => cards.filter((c) => c.issuer === issuer.name),
    [cards, issuer]
  )
  const [activeId, setActiveId] = useState(issuerCards[0]?.id)
  const activeCard = issuerCards.find((c) => c.id === activeId) ?? issuerCards[0]

  return (
    <main className="page">
      <header className="issuer-intro">
        <p className="eyebrow">Issuer</p>
        <h1>{issuer.name}</h1>
      </header>

      {issuerCards.length === 0 && (
        <p className="empty-note">No cards for this issuer yet.</p>
      )}

      {issuerCards.length === 1 && (
        <p className="single-card-note">
          Only one {issuer.name} card is in the dataset so far, so there's nothing to compare it
          against yet — showing its full detail below.
        </p>
      )}

      {issuerCards.length > 1 && <ComparisonChart cards={issuerCards} />}

      {issuerCards.length > 1 && (
        <CardTabs cards={issuerCards} activeId={activeCard?.id} onSelect={setActiveId} />
      )}

      {activeCard && <CardDetail card={activeCard} />}
    </main>
  )
}

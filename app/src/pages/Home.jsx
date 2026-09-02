import { Link } from 'react-router-dom'
import { ISSUERS } from '../constants.js'
import './Home.css'

export default function Home({ cards }) {
  return (
    <main className="page">
      <header className="home-intro">
        <h1>Compare credit cards by issuer</h1>
        <p className="lede">
          {cards.length} cards across {ISSUERS.length} issuers. Pick an issuer to see its cards
          compared side by side, or jump straight to comparing any cards across issuers.
        </p>
      </header>

      <div className="issuer-grid">
        {ISSUERS.map((issuer) => {
          const issuerCards = cards.filter((c) => c.issuer === issuer.name)
          return (
            <Link key={issuer.slug} to={`/${issuer.slug}`} className="issuer-tile">
              <h2>{issuer.name}</h2>
              <p>
                {issuerCards.length} card{issuerCards.length !== 1 ? 's' : ''}
              </p>
              <ul>
                {issuerCards.map((c) => (
                  <li key={c.id}>{c.name}</li>
                ))}
              </ul>
            </Link>
          )
        })}
      </div>

      <Link to="/compare" className="compare-cta">
        Compare cards across issuers →
      </Link>
    </main>
  )
}

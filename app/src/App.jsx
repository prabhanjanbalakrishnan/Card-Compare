import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SiteHeader from './components/SiteHeader.jsx'
import Home from './pages/Home.jsx'
import IssuerPage from './pages/IssuerPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import { ISSUERS } from './constants.js'
import './App.css'

export default function App() {
  const [cards, setCards] = useState(null)

  useEffect(() => {
    fetch('/data/cards.json')
      .then((res) => res.json())
      .then((data) => setCards(data.cards))
  }, [])

  if (!cards) {
    return <div className="loading">Loading cards…</div>
  }

  return (
    <BrowserRouter>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<Home cards={cards} />} />
        {ISSUERS.map((issuer) => (
          <Route
            key={issuer.slug}
            path={`/${issuer.slug}`}
            element={<IssuerPage cards={cards} issuer={issuer} />}
          />
        ))}
        <Route path="/compare" element={<ComparePage cards={cards} />} />
      </Routes>
    </BrowserRouter>
  )
}

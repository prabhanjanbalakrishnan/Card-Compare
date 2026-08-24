import { HashRouter, Routes, Route } from 'react-router-dom'
import SiteHeader from './components/SiteHeader.jsx'
import Home from './pages/Home.jsx'
import IssuerPage from './pages/IssuerPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import FindMyCardPage from './pages/FindMyCardPage.jsx'
import { ISSUERS } from './constants.js'
import cardsData from './data/cards.json'
import './App.css'

const cards = cardsData.cards

export default function App() {
  return (
    <HashRouter>
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
        <Route path="/find-my-card" element={<FindMyCardPage cards={cards} />} />
        <Route path="/compare" element={<ComparePage cards={cards} />} />
      </Routes>
    </HashRouter>
  )
}

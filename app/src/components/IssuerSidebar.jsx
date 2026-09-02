import { NavLink } from 'react-router-dom'
import { ISSUERS } from '../constants.js'
import './IssuerSidebar.css'

export default function IssuerSidebar() {
  return (
    <nav className="issuer-sidebar" aria-label="Issuers">
      <div className="issuer-sidebar-home">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
          All issuers
        </NavLink>
      </div>
      <p className="issuer-sidebar-label">Browse by issuer</p>
      {ISSUERS.map((issuer) => (
        <NavLink
          key={issuer.slug}
          to={`/${issuer.slug}`}
          className={({ isActive }) => (isActive ? 'active' : undefined)}
        >
          {issuer.short}
        </NavLink>
      ))}
    </nav>
  )
}

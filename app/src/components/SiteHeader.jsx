import { NavLink } from 'react-router-dom'
import { ISSUERS } from '../constants.js'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <NavLink to="/" className="brand">
          Card Compare
        </NavLink>
        <nav className="site-nav">
          {ISSUERS.map((issuer) => (
            <NavLink
              key={issuer.slug}
              to={`/${issuer.slug}`}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {issuer.short}
            </NavLink>
          ))}
          <NavLink
            to="/find-my-card"
            className={({ isActive }) => `nav-cta${isActive ? ' active' : ''}`}
          >
            Find My Card
          </NavLink>
          <NavLink
            to="/compare"
            className={({ isActive }) => `nav-cta${isActive ? ' active' : ''}`}
          >
            Compare
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

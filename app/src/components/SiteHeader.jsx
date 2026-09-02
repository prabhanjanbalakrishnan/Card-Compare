import { NavLink } from 'react-router-dom'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <NavLink to="/" className="brand">
          Card Compare
        </NavLink>
        <nav className="site-nav">
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

import { ISSUERS } from '../constants.js'
import './CardDetail.css'

export default function CardDetail({ card }) {
  const { partnerships, tier, pointsProgram } = card
  const airlines = partnerships?.transferPartners?.airlines ?? []
  const hotels = partnerships?.transferPartners?.hotels ?? []
  const issuerInfo = ISSUERS.find((i) => i.name === card.issuer)

  return (
    <article className="detail-card">
      <div className="detail-head">
        <div>
          <h3>{card.name}</h3>
          <div className="detail-issuer-line">
            {card.issuer} · {card.network}
          </div>
        </div>
        <div className="detail-fee-block">
          <span className="num detail-fee">${card.annualFee}</span>
          <span className="detail-fee-label">annual fee</span>
        </div>
      </div>

      <div className="tier-row">
        {tier.lineup.map((t, i) => {
          const isCurrent = t.toLowerCase().includes(`$${card.annualFee}`)
          return (
            <span key={i} className={`chip${isCurrent ? ' current' : ''}`}>
              {t}
            </span>
          )
        })}
      </div>
      {card.annualFeeNote && <p className="detail-note">{card.annualFeeNote}</p>}

      <section className="detail-section">
        <h4>Points earning — {pointsProgram.name}</h4>
        {pointsProgram.earningRates.map((r, i) => (
          <div key={i} className="rate-row">
            <span className="rate-badge">{r.rate}</span>
            <span>
              {r.category}
              {r.cap && <em className="dim"> ({r.cap})</em>}
            </span>
          </div>
        ))}
      </section>

      <section className="detail-section">
        <h4>Redemption</h4>
        <ul className="plain-list">
          {pointsProgram.redemption.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="detail-section">
        <h4>Perks &amp; benefits</h4>
        <ul className="plain-list">
          {card.perks.map((p, i) => (
            <li key={i}>
              <span>
                {p.name}
                {p.note && <em className="dim"> — {p.note}</em>}
              </span>
              {p.value && <span className="num perk-value">{p.value}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="detail-section">
        <h4>Partnerships</h4>
        {airlines.length > 0 && (
          <div className="partner-group">
            <p className="partner-label">Airline transfer partners ({airlines.length})</p>
            <ul className="partner-chip-list">
              {airlines.map((a, i) => (
                <li key={i} className="chip">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
        {hotels.length > 0 && (
          <div className="partner-group">
            <p className="partner-label">Hotel transfer partners ({hotels.length})</p>
            <ul className="partner-chip-list">
              {hotels.map((h, i) => (
                <li key={i} className="chip">
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
        {partnerships.coBrand && (
          <p className="partner-line">
            <span className="partner-label">Co-brand </span>
            {partnerships.coBrand}
          </p>
        )}
        {partnerships.other && (
          <p className="partner-line">
            <span className="partner-label">Other </span>
            {partnerships.other}
          </p>
        )}
      </section>

      {card.flags?.length > 0 && (
        <section className="disclaimer-box">
          <h4>Double-check these details</h4>
          <ul>
            {card.flags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          {issuerInfo?.website && (
            <p className="disclaimer-link-row">
              For the most accurate, up-to-date information, visit{' '}
              <a href={issuerInfo.website} target="_blank" rel="noopener noreferrer">
                {issuerInfo.name}'s official card page ↗
              </a>
            </p>
          )}
        </section>
      )}
    </article>
  )
}

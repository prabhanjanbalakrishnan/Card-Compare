import './ComparisonChart.css'

function partnerCount(card) {
  const airlines = card.partnerships?.transferPartners?.airlines?.length ?? 0
  const hotels = card.partnerships?.transferPartners?.hotels?.length ?? 0
  return airlines + hotels
}

export default function ComparisonChart({ cards }) {
  return (
    <div className="chart-scroll">
      <table className="chart-table">
        <thead>
          <tr>
            <th className="row-label-col">&nbsp;</th>
            {cards.map((card) => (
              <th key={card.id}>{card.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className="row-label-col">Annual fee</th>
            {cards.map((card) => (
              <td key={card.id} className="num fee-cell">
                ${card.annualFee}
                {card.annualFeeNote && <div className="fee-note">{card.annualFeeNote}</div>}
              </td>
            ))}
          </tr>
          <tr>
            <th className="row-label-col">Tier</th>
            {cards.map((card) => (
              <td key={card.id}>{card.tier.rank}</td>
            ))}
          </tr>
          <tr>
            <th className="row-label-col">Points program</th>
            {cards.map((card) => (
              <td key={card.id}>{card.pointsProgram.name}</td>
            ))}
          </tr>
          <tr>
            <th className="row-label-col">Top earning rates</th>
            {cards.map((card) => (
              <td key={card.id}>
                <ul className="chart-mini-list">
                  {card.pointsProgram.earningRates.slice(0, 3).map((r, i) => (
                    <li key={i}>
                      <span className="rate-badge">{r.rate}</span> {r.category}
                    </li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
          <tr>
            <th className="row-label-col">Perks</th>
            {cards.map((card) => (
              <td key={card.id}>
                <ul className="chart-mini-list">
                  {card.perks.slice(0, 4).map((p, i) => (
                    <li key={i}>{p.name}</li>
                  ))}
                </ul>
                {card.perks.length > 4 && (
                  <p className="chart-more">+{card.perks.length - 4} more — see tab below</p>
                )}
              </td>
            ))}
          </tr>
          <tr>
            <th className="row-label-col">Transfer partners</th>
            {cards.map((card) => (
              <td key={card.id} className="num">
                {partnerCount(card)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

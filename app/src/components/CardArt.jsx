import { getCardArt } from '../cardArt.js'
import './CardArt.css'

export default function CardArt({ card, size = 'lg' }) {
  const art = getCardArt(card)
  const style = {
    '--art-from': art.from,
    '--art-to': art.to,
    '--art-ink': art.ink,
    '--art-accent': art.accent ?? art.ink,
  }

  return (
    <div
      className={`card-art card-art-${size}`}
      style={style}
      role="img"
      aria-label={`Illustration of the ${card.name}`}
    >
      <div className="card-art-face" aria-hidden="true">
        <span className="card-art-issuer">{card.issuer}</span>
        {art.chip && <span className="card-art-chip" />}
        <span className="card-art-name">{art.label}</span>
        <span className="card-art-network">{art.network}</span>
        {art.accent && <span className="card-art-stripe" />}
      </div>
    </div>
  )
}

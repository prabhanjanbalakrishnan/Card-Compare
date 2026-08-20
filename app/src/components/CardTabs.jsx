import './CardTabs.css'

export default function CardTabs({ cards, activeId, onSelect }) {
  return (
    <div className="tabs" role="tablist">
      {cards.map((card) => (
        <button
          key={card.id}
          role="tab"
          aria-selected={card.id === activeId}
          className={`tab${card.id === activeId ? ' active' : ''}`}
          onClick={() => onSelect(card.id)}
        >
          {card.name}
        </button>
      ))}
    </div>
  )
}

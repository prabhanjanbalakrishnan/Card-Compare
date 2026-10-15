// Brand-inspired colors for the card illustrations — approximations, not issuer artwork.
const THEMES = {
  'amex-platinum': { label: 'Platinum', from: '#d4d7dc', to: '#8b919b', ink: '#1b1f27' },
  'amex-gold': { label: 'Gold', from: '#e3c27c', to: '#a87d2c', ink: '#2a1e08' },
  'amex-blue-cash-everyday': { label: 'Blue Cash Everyday', from: '#5aa0e6', to: '#1f5fa8', ink: '#ffffff' },
  'amex-blue-cash-preferred': { label: 'Blue Cash Preferred', from: '#27518f', to: '#0e2347', ink: '#ffffff' },
  'chase-sapphire-preferred': { label: 'Sapphire Preferred', from: '#2a6ac0', to: '#0d2f66', ink: '#ffffff' },
  'chase-sapphire-reserve': { label: 'Sapphire Reserve', from: '#1b2f55', to: '#0a1428', ink: '#ffffff' },
  'capital-one-venture-x': { label: 'Venture X', from: '#3b3b40', to: '#141416', ink: '#ffffff', accent: '#d03027' },
  'capital-one-venture': { label: 'Venture', from: '#46505e', to: '#1c2229', ink: '#ffffff', accent: '#d03027' },
  'bofa-premium-rewards': { label: 'Premium Rewards', from: '#d1203a', to: '#7d0a1c', ink: '#ffffff' },
  'bofa-premium-rewards-elite': { label: 'Premium Rewards Elite', from: '#2c2c2f', to: '#0d0d0e', ink: '#ffffff', accent: '#d1203a' },
  'citi-strata-premier': { label: 'Strata Premier', from: '#1560bd', to: '#06285a', ink: '#ffffff' },
  'wells-fargo-autograph-journey': { label: 'Autograph Journey', from: '#b8142c', to: '#5e0a18', ink: '#ffffff', accent: '#f2c230' },
  'discover-it-cash-back': { label: 'it Cash Back', from: '#f78a2a', to: '#c4590a', ink: '#ffffff' },
  'discover-it-miles': { label: 'it Miles', from: '#fbb04d', to: '#d0661a', ink: '#2a1404' },
  'td-cash': { label: 'Cash', from: '#43aa53', to: '#1c6b2c', ink: '#ffffff' },
  'td-double-up': { label: 'Double Up', from: '#25853f', to: '#0e4a22', ink: '#ffffff' },
  'td-clear': { label: 'Clear', from: '#9bd8aa', to: '#4b9a62', ink: '#0d2a16' },
  'apple-card': { label: 'Card', from: '#f7f7f9', to: '#d4d5da', ink: '#1d1d1f', chip: false },
}

const FALLBACK = { from: '#2a3a63', to: '#121a2e', ink: '#ffffff' }

export function getCardArt(card) {
  const theme = THEMES[card.id] ?? FALLBACK
  const network = (card.network ?? '').split(/[ /]/)[0].toUpperCase()
  return {
    from: theme.from,
    to: theme.to,
    ink: theme.ink,
    accent: theme.accent,
    chip: theme.chip !== false,
    label: theme.label ?? card.name,
    network,
  }
}

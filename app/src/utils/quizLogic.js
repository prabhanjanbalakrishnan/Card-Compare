// Rule-based card recommendation logic for the "Find My Card" quiz.
// No AI/LLM involved — everything here is keyword matching and arithmetic
// over the existing cards.json data. See CLAUDE.md for why: the app has no
// backend/API-key infrastructure and is published as a single static file.
//
// Answers (all collected by tapping, none typed):
//   spend:   array of up to 3 CATEGORIES keys the user spends most on
//   abroad:  boolean, only asked when TRAVEL is in `spend`
//   monthly: 'low' | 'mid' | 'high' — rough monthly card spend
//   style:   'cash' | 'points' | 'any' — preferred kind of rewards
//   maxFee:  number, or Infinity for "any amount" (hard filter)

export const CATEGORIES = {
  TRAVEL: 'TRAVEL',
  DINING: 'DINING',
  GROCERIES: 'GROCERIES',
  GAS: 'GAS',
  ENTERTAINMENT: 'ENTERTAINMENT',
  EVERYDAY: 'EVERYDAY',
}

// Used to tag each card's earningRate category prose (not the user's answers).
const KEYWORDS = {
  TRAVEL: [
    'flight', 'flights', 'fly', 'flying', 'airline', 'airlines', 'airfare', 'plane',
    'hotel', 'hotels', 'travel', 'trip', 'trips', 'vacation', 'rental car', 'car rental',
    'cruise', 'airbnb', 'booking.com', 'resort', 'lounge', 'tsa', 'global entry',
  ],
  DINING: [
    'restaurant', 'restaurants', 'dining', 'dine', 'eating out', 'takeout', 'take-out',
    'delivery', 'doordash', 'ubereats', 'uber eats', 'food delivery', 'cafe', 'coffee shop',
    'resy',
  ],
  GROCERIES: [
    'grocery', 'groceries', 'supermarket', 'supermarkets', 'whole foods',
    "trader joe's", 'instacart', 'food shopping', 'costco', 'wholesale club',
  ],
  GAS: [
    'gas', 'gasoline', 'fuel', 'ev charging', 'charging station', 'chargepoint',
    'exxon', 'shell', 'gas station',
  ],
  ENTERTAINMENT: [
    'streaming', 'netflix', 'spotify', 'movies', 'concerts', 'tickets',
    'entertainment', 'hulu', 'disney+', 'apple tv',
  ],
}

const TRAVEL_PERK_KEYWORDS = [
  'lounge', 'airport', 'airline', 'hotel', 'tsa', 'global entry', 'travel',
]

// Rough yearly card spend for each monthly bracket the quiz offers.
const ANNUAL_SPEND = { low: 3000, mid: 12000, high: 30000 }

// Maps a card's earningRate category prose to the 1-2 spend categories it best
// matches. Returns [] when nothing matches (e.g. Lyft, drugstores, rotating
// categories) — those niche rates must not be mistaken for the card's flat rate.
function categorizeText(rawText) {
  const text = (rawText || '').toLowerCase()
  const hits = []
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    const count = words.filter((w) => text.includes(w)).length
    if (count > 0) hits.push([cat, count])
  }
  if (hits.length === 0) return []
  hits.sort((a, b) => b[1] - a[1])
  return hits.slice(0, 2).map(([cat]) => cat)
}

function parseRateNumber(rateStr) {
  const match = /[\d.]+/.exec(rateStr || '')
  return match ? parseFloat(match[0]) : NaN
}

// Precomputes, per card, the best numeric earn rate seen for each spend
// category (based on the category prose in each earningRate entry).
function buildCardCategoryProfile(card) {
  const profile = {}
  for (const rate of card.pointsProgram.earningRates) {
    const numeric = parseRateNumber(rate.rate)
    if (Number.isNaN(numeric)) continue
    const tags = /everything else|all other|every purchase|every day|all purchases/i.test(rate.category)
      ? [CATEGORIES.EVERYDAY]
      : categorizeText(rate.category)
    for (const tag of tags) {
      profile[tag] = Math.max(profile[tag] ?? 0, numeric)
    }
  }
  return profile
}

function textMatchesAny(text, keywords) {
  const lower = (text || '').toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

function hasTravelSignal(card) {
  const airlines = card.partnerships?.transferPartners?.airlines?.length ?? 0
  const hotels = card.partnerships?.transferPartners?.hotels?.length ?? 0
  if (airlines > 0 || hotels > 0) return true
  const perkHits = card.perks.filter(
    (p) => textMatchesAny(p.name, TRAVEL_PERK_KEYWORDS) || textMatchesAny(p.note, TRAVEL_PERK_KEYWORDS)
  )
  return perkHits.length >= 2
}

// 'none' = advertises no foreign transaction fee, 'fee' = lists one, 'unknown' = not recorded.
function foreignFeeStatus(card) {
  for (const p of card.perks) {
    if (/no foreign transaction|no fees of any kind/i.test(p.name)) return 'none'
    if (/^foreign transaction fee/i.test(p.name) && p.value && !/^\$?0/.test(p.value)) return 'fee'
  }
  return 'unknown'
}

const isCashBack = (card) => /cash/i.test(card.pointsProgram.name)
const hasNoRewards = (card) => /no rewards/i.test(card.pointsProgram.name)

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi)

const listLabel = (cats) => cats.map((c) => c.toLowerCase()).join(' and ')

// Scores one card against the quiz answers. Returns { score, reasons }.
// Each signal adds at most one reason, and only when it actually moved the score.
function scoreCard(card, answers) {
  let score = 0
  const reasons = []
  const profile = buildCardCategoryProfile(card)
  const flat = profile[CATEGORIES.EVERYDAY] ?? 0
  const spend = answers.spend?.length ? answers.spend : [CATEGORIES.EVERYDAY]

  // Spend categories — what the card earns on each category the user picked,
  // falling back to its flat rate where it has no special rate for that category.
  const rates = spend.map((cat) =>
    cat === CATEGORIES.EVERYDAY ? flat : Math.max(profile[cat] ?? 0, flat)
  )
  const categoryScore = Math.min(
    (rates.reduce((sum, r) => sum + Math.min(r, 10) * 4, 0) / rates.length),
    40
  )
  score += categoryScore
  const boosted = spend.filter((cat) => cat !== CATEGORIES.EVERYDAY && (profile[cat] ?? 0) > flat)
  if (boosted.length > 0) {
    reasons.push(`Boosted earning on ${listLabel(boosted)}`)
  } else if (categoryScore > 0) {
    reasons.push('Solid flat earning rate on everyday spending')
  }

  // Travel — only counts when the user said travel is a major spend area.
  if (spend.includes(CATEGORIES.TRAVEL) && hasTravelSignal(card)) {
    score += 25
    reasons.push('Travel perks and transfer partners')
  }

  // Foreign use — only asked when travel was picked.
  if (answers.abroad === true) {
    const status = foreignFeeStatus(card)
    if (status === 'none') {
      score += 15
      reasons.push('No foreign transaction fees abroad')
    } else if (status === 'fee') {
      score -= 12
    }
  }

  // Monthly spend — does the card likely earn back more than its annual fee?
  const annualSpend = ANNUAL_SPEND[answers.monthly]
  if (annualSpend) {
    const blended = rates.reduce((a, b) => a + b, 0) / rates.length
    const net = annualSpend * (blended / 100) - card.annualFee
    score += clamp(net / 60, -12, 12)
    if (card.annualFee > 0 && net >= 0) {
      reasons.push('At your spending level, rewards should outweigh the annual fee')
    }
  }

  // Reward style
  if (!hasNoRewards(card)) {
    if (answers.style === 'cash' && isCashBack(card)) {
      score += 18
      reasons.push('Straightforward cash back, no points to track')
    } else if (answers.style === 'points' && !isCashBack(card)) {
      score += 18
      reasons.push('Points or miles with flexible redemption')
    }
  }

  if (reasons.length === 0) reasons.push('Closest overall fit to your answers')
  return { score, reasons }
}

function parseMaxFee(rawMaxFee) {
  const n = Number(rawMaxFee)
  if (!Number.isFinite(n) || n < 0) return Infinity
  return n
}

// Returns the top 3 cards for the given answers, each as
// { card, score, reasons, overBudget, overBudgetBy }.
export function rankTopCards(cards, answers) {
  const maxFee = parseMaxFee(answers.maxFee)

  const scoreAll = (pool) =>
    pool
      .map((card) => ({ card, ...scoreCard(card, answers) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        if (a.card.annualFee !== b.card.annualFee) return a.card.annualFee - b.card.annualFee
        return a.card.name.localeCompare(b.card.name)
      })

  const withinBudget = cards.filter((c) => c.annualFee <= maxFee)
  const ranked = scoreAll(withinBudget).map((r) => ({ ...r, overBudget: false, overBudgetBy: 0 }))

  if (ranked.length >= 3) {
    return ranked.slice(0, 3)
  }

  // Backfill from the full pool when the budget filter leaves too few cards.
  const pickedIds = new Set(ranked.map((r) => r.card.id))
  const remainder = cards.filter((c) => !pickedIds.has(c.id))
  const backfill = scoreAll(remainder).map((r) => ({
    ...r,
    overBudget: true,
    overBudgetBy: r.card.annualFee - maxFee,
  }))

  return [...ranked, ...backfill].slice(0, 3)
}

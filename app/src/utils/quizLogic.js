// Rule-based card recommendation logic for the "Find My Card" quiz.
// No AI/LLM involved — everything here is keyword matching and arithmetic
// over the existing cards.json data. See CLAUDE.md for why: the app has no
// backend/API-key infrastructure and is published as a single static file.

export const CATEGORIES = {
  TRAVEL: 'TRAVEL',
  DINING: 'DINING',
  GROCERIES: 'GROCERIES',
  GAS: 'GAS',
  ENTERTAINMENT: 'ENTERTAINMENT',
  EVERYDAY: 'EVERYDAY',
}

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
const DINING_PERK_KEYWORDS = ['dining', 'restaurant', 'resy', 'doordash', 'dashpass']

// Maps free text (either the user's Q2 answer, or a card's earningRate
// category prose) to 1-2 categories it best matches. Falls back to EVERYDAY
// when nothing matches, rather than returning nothing.
function categorizeText(rawText) {
  const text = (rawText || '').toLowerCase()
  const hits = []
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    const count = words.filter((w) => text.includes(w)).length
    if (count > 0) hits.push([cat, count])
  }
  if (hits.length === 0) {
    return { categories: [CATEGORIES.EVERYDAY], confidence: 'low' }
  }
  hits.sort((a, b) => b[1] - a[1])
  return { categories: hits.slice(0, 2).map(([cat]) => cat), confidence: 'high' }
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
    const tags = /everything else|all other|every purchase|every day/i.test(rate.category)
      ? [CATEGORIES.EVERYDAY]
      : categorizeText(rate.category).categories
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

function hasDiningSignal(card, profile) {
  const baseline = profile[CATEGORIES.EVERYDAY] ?? 0
  if ((profile[CATEGORIES.DINING] ?? 0) > baseline) return true
  return card.perks.some(
    (p) => textMatchesAny(p.name, DINING_PERK_KEYWORDS) || textMatchesAny(p.note, DINING_PERK_KEYWORDS)
  )
}

// Scores one card against the quiz answers. Returns { score, reasons }.
// Only reasons for signals that actually contributed points are included.
function scoreCard(card, answers) {
  let score = 0
  const reasons = []
  const profile = buildCardCategoryProfile(card)

  // Q1 — beginner-friendly nudge
  if (answers.hasCard === false && card.annualFee <= 95) {
    score += 10
    reasons.push('A good low-fee starting card since you don’t have one yet')
  }

  // Q2 — spend category match
  const { categories: spendCategories, confidence } = categorizeText(answers.spend)
  if (confidence === 'high') {
    let categoryScore = 0
    for (const cat of spendCategories) {
      const rate = profile[cat] ?? 0
      if (rate > 0) {
        categoryScore += Math.min(rate, 10) * 4
      }
    }
    categoryScore = Math.min(categoryScore, 40)
    if (categoryScore > 0) {
      score += categoryScore
      const label = spendCategories.map((c) => c.toLowerCase()).join(' and ')
      reasons.push(`Strong earning rate on ${label} — matches your top spending`)
    }
  } else {
    const flat = profile[CATEGORIES.EVERYDAY] ?? 0
    const categoryScore = Math.min(Math.min(flat, 10) * 4, 20)
    if (categoryScore > 0) {
      score += categoryScore
      reasons.push('Solid everyday earning rate for general spending')
    }
  }

  // Q3 — travel benefits
  const travelSignal = hasTravelSignal(card)
  if (answers.travel === true && travelSignal) {
    score += 25
    reasons.push('Strong travel perks/partners match your interest in trip benefits')
  } else if (answers.travel === false && !travelSignal) {
    score += 10
  }

  // Q4 — dining benefits
  const diningSignal = hasDiningSignal(card, profile)
  if (answers.dining === true && diningSignal) {
    score += 20
    reasons.push('Dining-focused perks/rate fit your love of eating out')
  } else if (answers.dining === false && !diningSignal) {
    score += 8
  }

  // Q5 — fee fit (always shown since it's the hard filter)
  if (card.annualFee === 0) {
    reasons.push('No annual fee')
  } else {
    reasons.push(`Fits within your $${answers.maxFee} annual fee limit`)
  }

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

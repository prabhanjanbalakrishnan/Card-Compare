# Card Compare

A credit card comparison web app that lets you browse, compare, and get matched with the right credit card — grouped by issuer, side by side, or through a guided quiz.

**Live app:** [card-compare-ashy.vercel.app](https://card-compare-ashy.vercel.app)

## What it does

Card Compare covers 16 cards across 9 major U.S. issuers (American Express, Chase, Capital One, Bank of America, Citi, Wells Fargo, Discover, TD Bank, and Apple), spanning premium travel cards down to no-annual-fee cash-back cards. It's built around three ways to explore that data:

- **Browse by issuer** — each issuer has its own page with a side-by-side comparison chart of its cards (annual fee, tier, points program, top earning rates, perks, transfer partners), plus tabs to drill into full details on any one card.
- **Compare across issuers** — pick any 2–4 cards from the entire lineup and compare them head-to-head, regardless of who issues them.
- **Find My Card** — a 5-question guided quiz that scores every card against your spending habits and budget, then recommends your top 3 matches with reasoning.

## Why I built it

Comparing credit cards usually means digging through a dozen issuer websites and rate-comparison blogs that all format things differently. I wanted one consistent view — the same fields, laid out the same way, for every card — so you can actually compare apples to apples instead of re-reading fine print on every tab.

## Tech stack

- **React** + **Vite** for the frontend and build tooling
- **React Router** (hash-based routing) for navigation
- Hand-compiled JSON dataset, bundled directly into the app — no backend, no API keys, fully static
- Deployed on **Vercel**, auto-deploying from this repo on every push to `main`

## Project structure

```
app/                      # the Vite/React application
  src/
    components/           # comparison chart, card detail panels, sidebar nav, quiz chat bubbles
    pages/                 # home, per-issuer pages, cross-issuer compare, Find My Card
    data/cards.json        # the card dataset the app runs on
    utils/quizLogic.js     # scoring logic behind the Find My Card quiz
data/
  cards-draft.json         # source dataset (research notes, flagged/uncertain fields)
```

## Running it locally

```bash
cd app
npm install
npm run dev
```

## A note on the data

The card details (fees, rewards rates, perks, transfer partners) were hand-researched and compiled rather than pulled from a live API. Some fields are still marked as open questions pending a source re-check — see `data/cards-draft.json` for specifics. Promotional details like welcome bonus amounts change too often to treat as fixed, so they're intentionally left out of the dataset.

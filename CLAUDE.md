# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A credit card comparison web app. Loosely mirrors the sibling `Pokemon Project` (static JSON dataset, no backend), but diverges in two ways specific to this project's needs: the dataset is small (16 cards) and hand-compiled from research rather than fetched from an API, and the app needs to be shareable as a standalone file (see "Publishing a shareable build" below) — so `app/src/App.jsx` **imports** `app/src/data/cards.json` directly as a JS module (bundled at build time) rather than fetching it at runtime, and routing uses `HashRouter` (not `BrowserRouter`) so it works with no server-side routing support.

Started as premium travel cards only; as of 2026-08-21 also covers lower-tier, non-travel cash-back cards (Discover, TD Bank) and single-product cards (Apple Card) at the user's request — the schema and components generalize to all of these (see "The 16 cards covered" below).

## Commands

All commands run from `app/`:

- `npm run dev` — start the Vite dev server
- `npm run build` — production build (outputs `app/dist/`, gitignored)
- `npm run lint` — run oxlint

## Publishing a shareable build

The app is a full Vite/React SPA, so it can't be shared as a plain `localhost` link (that only works on the machine running the dev server) or published to a Claude Artifact as-is (Artifacts are a single self-contained HTML file with a strict CSP — no arbitrary server, no separate JS/CSS asset files, no runtime `fetch` of local files). To share a working link:

1. `cd app && npm run build` — produces `dist/index.html` + hashed `dist/assets/*.js` and `*.css`.
2. Inline the built JS and CSS into one file with an explicit `<meta charset="UTF-8" />` (the perks/partnerships text has ® ℠ · and other non-ASCII characters — omitting this charset tag causes mojibake when the file is served without an explicit content-type charset). A one-off Python inlining script was used for this on 2026-08-20; regenerate similarly rather than hand-editing `dist/` output. Do **not** include `<!DOCTYPE>`/`<html>`/`<head>`/`<body>` wrapper tags — the Artifact tool adds those itself; the file should start directly with `<meta charset>`/`<title>`/`<style>`/body content.
3. Sanity-check the inlined file before publishing: serve `dist/` with `python3 -m http.server <port>` and load it in a real browser tab (not `file://` — the Browser pane renders `file://` paths outside the project folder as static snapshots, which won't execute the JS, so it looks broken even when it isn't) to confirm no console errors and that text renders correctly (mojibake is the most likely failure mode).
4. Publish via the Artifact tool. The published artifact is private by default — verifying it after publishing from an agent session isn't possible (no user login), so confirm correctness via step 3 first and ask the user to do a final click-through.

**Published Artifact URL**: https://claude.ai/code/artifact/69c74289-17b2-4a5e-af17-0fa02a4177d4 — pass this as `url` when republishing an updated build so it updates in place instead of creating a new artifact. Kept in sync with `main` as of 2026-08-20 (includes the partnerships chip-list change below); republish after any further UI change if the user is actively sharing this link. Update this line if the user shares a different/newer URL.

**Dev server gotcha in this environment**: the Browser pane's `preview_start`/`preview_logs` tools are anchored to the sibling `Pokemon Project` directory (wherever this session's Browser pane was first initialized) and will silently launch *that* project's dev server on port 5173 instead of reading this project's `.claude/launch.json`, even when asked for `credit-card-app` by name. If you hit this, either (a) it's likely stale/harmless — check `lsof -nP -iTCP:5173 -sTCP:LISTEN` and `preview_stop` it, or (b) just run this app's dev server directly: `cd app && npm run dev -- --port <N> --strictPort` in the background via Bash, then point the Browser pane at `http://localhost:<N>` with `navigate` (not `preview_start` with a `name`; `preview_start` with a `url` works fine). Historically port 5180 was used for this, but if another concurrent session already has a dev server bound there (seen 2026-08-24 — check with `lsof -nP -iTCP:<port> -sTCP:LISTEN`), just pick a free port instead (5181 worked). This may be specific to how this particular session was initialized — re-check whether it's still an issue in future sessions before assuming it's permanent.

## Current status: app built, data still marked draft

The app (`app/`) is built and functional — issuer pages with comparison charts + tabs, a cross-issuer compare tool, home page — see "UI direction" below for the shape. **The underlying data is still a first-pass draft**: several fields are flagged as uncertain (see below) and haven't been confirmed by the user. Treat `app/src/data/cards.json` as provisional; it's a direct copy of `data/cards-draft.json` (no build script syncs them — edit both or write one when the data is finalized).

- [`data/cards-draft.json`](data/cards-draft.json) — the raw draft dataset, one entry per card
- [`data/cards-review.html`](data/cards-review.html) — a standalone HTML review page (built with the `artifact-design` skill) rendering the dataset as a summary table + per-card dossiers, with flagged/uncertain fields called out in amber. Open this directly in a browser to review, or re-publish it as a Claude Artifact.

### The 16 cards covered

The first 10 were chosen to match the user's ask: "top travel cards in the world... Amex tiers, Capital One tiers, Chase tiers, Bank of America tiers, etc." 5 more were added 2026-08-21 as "lower tier, non-travel" examples (Discover, TD Bank), plus Apple Card the same day. All are US-market cards (reliable structured data on non-US issuers is much harder to verify — flag this to the user if truly global cards are wanted later).

| Card | Issuer | Tier position |
|---|---|---|
| Amex Platinum | American Express | 3 of 4 (Green < Gold < **Platinum** < Centurion, invite-only) |
| Amex Gold | American Express | 2 of 4 |
| Chase Sapphire Reserve | Chase | 2 of 2 (top) |
| Chase Sapphire Preferred | Chase | 1 of 2 |
| Capital One Venture X | Capital One | 3 of 3 (top) |
| Capital One Venture | Capital One | 2 of 3 |
| BofA Premium Rewards Elite | Bank of America | 3 of 3 (top) |
| BofA Premium Rewards | Bank of America | 2 of 3 |
| Citi Strata Premier | Citi | 2 of 3 (successor to discontinued Citi Prestige) |
| Wells Fargo Autograph Journey | Wells Fargo | 2 of 3 (a new "Premier Autograph" tier launched above it Feb 2026, not yet mainstream) |
| Discover it Cash Back | Discover | Flagship no-fee cash back card (parallel to Discover it Miles — Discover has no premium/annual-fee tier) |
| Discover it Miles | Discover | Discover's only "travel-flavored" card; flat 1.5x, no premium tier above it |
| TD Cash | TD Bank | Mid-tier cash back, below TD First Class Visa Signature |
| TD Double Up | TD Bank | Mid-tier flat cash back (up to 2%, conditional — see flags) |
| TD Clear | TD Bank | Bottom tier — **no rewards program at all**, monthly-fee-instead-of-interest structure |
| Apple Card | Apple | Single product, no tiers — "Apple Card Family" is a sharing feature, not a different tier |

### Data fields per card (see `cards-draft.json` for exact schema)

Matches the 5 comparison points the user asked for, plus supporting fields:
`id`, `name`, `issuer`, `network`, `annualFee` (+ optional `annualFeeNote` — used by TD Clear, whose "$0 annual fee" is misleading without the monthly-fee explanation; `ComparisonChart.jsx` renders this note under the fee figure when present), `tier` (family/lineup/rank), `pointsProgram` (name, earning rates, redemption mechanics — for cash-back cards use `name: "Cash Back"` and percentage rates like `"5%"` rather than points/miles multipliers; for a no-rewards card like TD Clear, don't leave `earningRates`/`redemption` empty arrays — the UI renders those sections' headers regardless, so an empty array looks broken; instead give one explicit entry like `{"rate": "—", "category": "This card has no cash back, points, or miles"}`), `partnerships` (transfer partners by airline/hotel, co-brand, other — empty arrays are fine and already handled; several cards genuinely have none), `perks` (array of name/value/note), `flags` (array of strings — open questions worth a manual spot-check).

**Rate badge values must stay short** (`"5x"`, `"3%"`, not a full word like `"selectable"`) — the `.rate-badge` styling in both `ComparisonChart.css` and `CardDetail.css` is sized for compact tokens, and a single long unbreakable word can overflow its box even with `overflow-wrap: break-word` set (which is now set defensively in both files, but shortening the data is the real fix). Put any nuance in the `category` string instead, as most existing entries already do.

### Known open questions (flagged in the data, worth resolving before shipping)

- **Amex Platinum** — CLEAR+ credit is $209 vs $219 depending on source; Oura Ring/other newer perks should be reconfirmed as still live; Etihad's status as a transfer partner is uncertain post-June 2026.
- **Chase Sapphire Preferred** — the Hyatt 1:1 → 4:3 transfer-ratio downgrade is corroborated only via secondary sources (403s blocked direct verification).
- **Chase Sapphire Reserve** — many lifestyle credits (DoorDash/Lyft/Apple/StubHub) carry hard 2026/2027 expiration dates as time-limited promos, not permanent features — don't treat them as fixed.
- **BofA Premium Rewards (base)** — unclear whether the 20%-off-airfare-via-points perk extends to this tier or is Elite-exclusive.
- **Citi Strata Premier** — transfer partner list may be incomplete (historically included Turkish Airlines, Qantas, Singapore KrisFlyer, Air France/KLM — not confirmed present in this pass); several insurance benefit dollar caps unconfirmed.
- **Wells Fargo Autograph Journey** — purchase protection / extended warranty status is genuinely conflicting: the official Guide to Benefits omits them, but some third-party sites claim they exist (possibly conflating with the newer "Premier Autograph" card).
- All **welcome bonus** figures are rotating promotional offers, not permanent card features — re-verify at build time rather than hardcoding.
- **TD Cash** — the exact tiered rate for the 2 cardholder-selected quarterly categories wasn't fully itemized by research (only the default Dining 3%/Grocery 2% categories are confirmed); shown as "Pick 2" in the rate badge pending confirmation.
- **TD Double Up** — the "up to 2%" is conditional: 1% on purchase + 1% only if redeemed into a TD deposit account, not an unconditional flat 2% (a common point of confusion with similar-sounding cards from other issuers). Sign-up bonus figure conflicts across sources (current official offer $200/$1,500 spend vs. an older press release's $75/$500 — used the current one). Also flagged as possibly not available in all states, unconfirmed which ones.
- **TD Clear** — balance transfer fee couldn't be confirmed (source terms PDF was unreadable by the research tooling). The "no rewards at all" claim is high confidence (two independent sources) but flagged given how unusual the product structure is.
- **Discover (both cards)** — the $0 foreign transaction fee is well-corroborated by secondary sources but wasn't found explicitly itemized in the official page text captured; same for the exact late-fee amount.
- **Apple Card** — issuing bank is Goldman Sachs Bank USA as of today, but JPMorgan Chase announced a takeover of the Apple Card portfolio in Jan 2026 (~24-month transition, not expected to complete until ~early 2028). This is the single most likely fact in the whole dataset to go stale — re-check it periodically. Also: Apple Card Savings account APY wasn't captured (changes frequently), and the 3% Daily Cash merchant partner list is curated by Apple and known to change periodically.

## UI direction (decided 2026-08-20, built same day)

Rejected a flat grid/list of all 10 cards in favor of an issuer-grouped structure:

- **One route per issuer**: `/amex`, `/chase`, `/capital-one`, `/bank-of-america`, `/citi`, `/wells-fargo`, `/discover`, `/td-bank`, `/apple` (route slugs and display names live in `app/src/constants.js`'s `ISSUERS` array — add an issuer there and it automatically gets a route, nav link, and home-page tile; this is exactly how Discover, TD Bank, and Apple were added). Each route (`app/src/pages/IssuerPage.jsx`) shows a **comparison chart** (`app/src/components/ComparisonChart.jsx`) of that issuer's cards when there are 2+, e.g. the Amex page compares Platinum vs. Gold row-by-row across annual fee, tier, points program, top earning rates, perks, transfer-partner count.
- **Tabs below the chart** (`app/src/components/CardTabs.jsx`) let the user click a card name to swap in that card's full detail panel (`app/src/components/CardDetail.jsx` — all perks, partnerships, points system, plus any `flags`) without leaving the page. Transfer partners (airlines/hotels) render as individual chips with a count in the label (e.g. "Airline transfer partners (17)"), not a comma-joined line — long partner lists were hard to scan as prose. Reuses the same `.chip` pill style as the tier lineup for visual consistency.
- **A separate cross-issuer compare tool** at `/compare` (`app/src/pages/ComparePage.jsx`) lets the user checkbox-select 2–4 cards from *any* issuer and reuses the same `ComparisonChart`/`CardTabs`/`CardDetail` components.
- **Citi, Wells Fargo, and Apple currently have only one card each** in the dataset, so their issuer pages fall back to a single-card notice + detail panel instead of a comparison chart (handled automatically by `IssuerPage.jsx`'s `issuerCards.length` check — no special-casing needed elsewhere). For Apple this is permanent, not a research gap — Apple Card genuinely has no tiered lineup (confirmed via research; "Apple Card Family" is a sharing feature, not a different product). Comparison charts for Citi/Wells Fargo will appear automatically once a second card is added to `cards-draft.json`/`cards.json` for that issuer.
- Home page (`/`, `app/src/pages/Home.jsx`) is a hub: tiles linking to each issuer (showing card count + names) plus a CTA to `/compare`.

Design tokens (IBM Plex Sans/Serif/Mono, the "ledger" color palette) are shared between the original `data/cards-review.html` review page and the live app's `app/src/index.css`, so the two look/feel consistent.

## "Find My Card" quiz (added 2026-08-24)

A guided, chat-bubble-style quiz at `/find-my-card` (nav link between the issuer links and `Compare`) that asks 5 fixed questions and recommends the top 3 matching cards with reasoning. **This is rule-based, not AI** — a deliberate choice, confirmed with the user, since the app has zero backend/API-key infrastructure and is published as a single static file (a real LLM-powered chatbot is an explicit future phase, not built yet).

- `app/src/utils/quizLogic.js` — pure scoring logic, no React. Exports `rankTopCards(cards, answers)`. Free-text spending answers (question 2) are matched against a keyword dictionary (`TRAVEL`/`DINING`/`GROCERIES`/`GAS`/`ENTERTAINMENT`/`EVERYDAY`) that's also used to tag each card's `pointsProgram.earningRates[].category` prose, so the two sides can be compared — falls back to the `EVERYDAY`/flat rate at half weight when nothing matches, rather than erroring. Question 5 (max annual fee) is a **hard filter** (`card.annualFee > maxFee` excluded), not a soft score; if fewer than 3 cards pass, the function backfills from the full pool and marks each backfilled result `overBudget: true` with the exact dollar amount over. Point multipliers and cash-back percentages are compared as raw numbers for ranking — a documented simplification, not real financial equivalence (there's a disclaimer line in the UI above the results for this reason).
- `app/src/pages/FindMyCardPage.jsx` — the page; a `useReducer` state machine drives the chat transcript (bot question bubbles + user answer bubbles) and tracks accumulated answers. On completion it reuses the existing `CardTabs` + `CardDetail` components (not `ComparisonChart`, which is built for dense side-by-side comparison rather than three individually-reasoned results) to show the top 3, plus a "Start over" button that resets to initial state.
- `app/src/components/ChatBubble.jsx` — small presentational component (bot bubble left-aligned/neutral, user bubble right-aligned/accent-colored), reused for every message in the transcript.
- Wired up like `/compare`: a plain `<Route>` in `App.jsx` (not derived from the `ISSUERS` array) and a `NavLink` in `SiteHeader.jsx`.

**Known limitation, not yet exercised live:** the "backfill when <3 cards pass the fee filter" path can't currently be triggered through the UI, because the dataset always has 6 cards at $0 annual fee — verified correct by code review, not by a live click-through. Worth an actual live test if the dataset ever shrinks below 3 cards at any given fee tier.

## Next steps (when resuming this project)

1. Walk through `data/cards-review.html` (or the live app itself) with the user and resolve the flagged items above — either by direct confirmation or a fresh round of research. Once confirmed, update both `data/cards-draft.json` and `app/src/data/cards.json` (currently identical copies). Note: `cards-review.html` was built for the original 10 cards (2026-08-19) and has **not** been regenerated for the 5 cards added 2026-08-21 — it's stale. Either regenerate it (same JSON-injection approach as originally, see git history) or retire it in favor of reviewing directly in the live app, which already surfaces `flags` per card.
2. Consider researching the sibling Citi Strata ($0) and Citi Strata Elite ($595) cards (already named in the existing `citi-strata-premier` entry's `tier.lineup`) so Citi gets a real comparison chart — same idea for a second Wells Fargo card if desired.
3. Revisit card scope later if the user wants more cards (business cards, non-US issuers, more Discover/TD Bank tiers like TD Cash Secured or TD First Class Visa Signature) — deliberately out of scope for this pass.
4. No automated tests exist yet. Verification so far has been manual: `npm run lint` (oxlint, clean) plus interactive checks in the Browser pane (chart rendering, tab switching, cross-issuer compare, light/dark theme, and — as of 2026-08-21 — a DOM-walking `scrollWidth > clientWidth` overflow check run via `javascript_tool` after any data/CSS change, which is how both the perk-value overflow and the "selectable" rate-badge overflow were caught; worth re-running that check whenever new card data is added, since it catches real bugs screenshots can miss).
5. A real AI-powered chatbot (free-form questions, not the fixed 5-question quiz) is an explicit possible future phase — the user was offered this now and chose the rule-based quiz instead specifically to avoid an architecture change. If this comes up again, it requires adding a backend/serverless proxy to hold an API key safely, which breaks the current single-file-Artifact publishing model — flag that trade-off before starting.

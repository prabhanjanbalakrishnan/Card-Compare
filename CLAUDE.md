# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A credit card comparison web app (early stage — no app code yet, only research/data so far). The plan is to mirror the architecture of the sibling `Pokemon Project`: a one-time data-compilation step producing a static JSON dataset, loaded once by a React app with no backend.

## Current status: dataset drafted, awaiting review

No app has been scaffolded yet. What exists is a **draft dataset of 10 travel credit cards**, researched via parallel agents browsing official issuer pages (cross-checked against NerdWallet, The Points Guy, Bankrate, CNBC Select) on 2026-08-19. The user has not yet confirmed it's accurate — **do not build the app on top of this data without a review pass**, since several fields are flagged as uncertain (see below).

- [`data/cards-draft.json`](data/cards-draft.json) — the raw draft dataset, one entry per card
- [`data/cards-review.html`](data/cards-review.html) — a standalone HTML review page (built with the `artifact-design` skill) rendering the dataset as a summary table + per-card dossiers, with flagged/uncertain fields called out in amber. Open this directly in a browser to review, or re-publish it as a Claude Artifact.

### The 10 cards covered

Chosen to match the user's ask: "top travel cards in the world... Amex tiers, Capital One tiers, Chase tiers, Bank of America tiers, etc." All are US-market cards (reliable structured data on non-US issuers is much harder to verify — flag this to the user if truly global cards are wanted later).

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

### Data fields per card (see `cards-draft.json` for exact schema)

Matches the 5 comparison points the user asked for, plus supporting fields:
`id`, `name`, `issuer`, `network`, `annualFee` (+ optional note), `tier` (family/lineup/rank), `pointsProgram` (name, earning rates, redemption mechanics), `partnerships` (transfer partners by airline/hotel, co-brand, other), `perks` (array of name/value/note), `flags` (array of strings — open questions worth a manual spot-check).

### Known open questions (flagged in the data, worth resolving before shipping)

- **Amex Platinum** — CLEAR+ credit is $209 vs $219 depending on source; Oura Ring/other newer perks should be reconfirmed as still live; Etihad's status as a transfer partner is uncertain post-June 2026.
- **Chase Sapphire Preferred** — the Hyatt 1:1 → 4:3 transfer-ratio downgrade is corroborated only via secondary sources (403s blocked direct verification).
- **Chase Sapphire Reserve** — many lifestyle credits (DoorDash/Lyft/Apple/StubHub) carry hard 2026/2027 expiration dates as time-limited promos, not permanent features — don't treat them as fixed.
- **BofA Premium Rewards (base)** — unclear whether the 20%-off-airfare-via-points perk extends to this tier or is Elite-exclusive.
- **Citi Strata Premier** — transfer partner list may be incomplete (historically included Turkish Airlines, Qantas, Singapore KrisFlyer, Air France/KLM — not confirmed present in this pass); several insurance benefit dollar caps unconfirmed.
- **Wells Fargo Autograph Journey** — purchase protection / extended warranty status is genuinely conflicting: the official Guide to Benefits omits them, but some third-party sites claim they exist (possibly conflating with the newer "Premier Autograph" card).
- All **welcome bonus** figures are rotating promotional offers, not permanent card features — re-verify at build time rather than hardcoding.

## UI direction (decided 2026-08-20, not yet built)

Rejected a flat grid/list of all 10 cards in favor of an issuer-grouped structure:

- **One route per issuer**: `/amex`, `/chase`, `/capital-one`, `/bank-of-america`, `/citi`. Each route shows a **comparison chart** (side-by-side table) of that issuer's cards — e.g. the Amex page compares Platinum vs. Gold row-by-row across annual fee, perks, points earning, partnerships.
- **Tabs below the chart** let the user click a card name (e.g. "Platinum" / "Gold") to swap in that card's full detail panel (all perks, partnerships, points system) without leaving the page.
- **A separate cross-issuer compare tool** (e.g. `/compare`) where the user picks 2–4 cards from *any* issuer to view side-by-side — in addition to, not instead of, the 5 issuer pages.
- **Wells Fargo caveat**: the dataset only has one Wells Fargo card (Autograph Journey), so it has no same-issuer comparison chart to build — it'd need its own single-card page (no tabs/chart needed) or folding into the cross-issuer compare tool only. Confirm with the user how they want Wells Fargo handled before building.
- Home page (`/`) still needs a decision: likely a simple hub linking to the 5 issuer pages + the compare tool.

## Next steps (when resuming this project)

1. Walk through `data/cards-review.html` with the user and resolve the flagged items above (either by direct confirmation from the user or a fresh round of research).
2. Resolve the Wells Fargo page question above.
3. Scaffold the React app in an `app/` directory, following the Pokémon project's pattern: Vite + React + `react-router-dom`, a `scripts/` one-time data-build step (or just hand off `cards-draft.json` directly as `app/public/data/cards.json` once finalized — no external API dependency like PokeAPI exists here, so a live pipeline script may be unnecessary; a one-time manual JSON file may be sufficient).
4. Build the issuer-page comparison chart + tab-based detail component (reused across all 5 issuer routes), then the cross-issuer `/compare` tool, per the UI direction above.
5. Revisit card scope later if the user wants more cards, business cards, or non-US issuers — deliberately out of scope for this first pass.

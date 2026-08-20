# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A credit card comparison web app. Loosely mirrors the sibling `Pokemon Project` (static JSON dataset, no backend), but diverges in two ways specific to this project's needs: the dataset is small (10 cards) and hand-compiled from research rather than fetched from an API, and the app needs to be shareable as a standalone file (see "Publishing a shareable build" below) — so `app/src/App.jsx` **imports** `app/src/data/cards.json` directly as a JS module (bundled at build time) rather than fetching it at runtime, and routing uses `HashRouter` (not `BrowserRouter`) so it works with no server-side routing support.

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

**Dev server gotcha in this environment**: the Browser pane's `preview_start`/`preview_logs` tools are anchored to the sibling `Pokemon Project` directory (wherever this session's Browser pane was first initialized) and will silently launch *that* project's dev server on port 5173 instead of reading this project's `.claude/launch.json`, even when asked for `credit-card-app` by name. If you hit this, either (a) it's likely stale/harmless — check `lsof -nP -iTCP:5173 -sTCP:LISTEN` and `preview_stop` it, or (b) just run this app's dev server directly: `cd app && npm run dev -- --port 5180 --strictPort` in the background via Bash, then point the Browser pane at `http://localhost:5180` with `navigate` (not `preview_start`). This may be specific to how this particular session was initialized — re-check whether it's still an issue in future sessions before assuming it's permanent.

## Current status: app built, data still marked draft

The app (`app/`) is built and functional — issuer pages with comparison charts + tabs, a cross-issuer compare tool, home page — see "UI direction" below for the shape. **The underlying data is still a first-pass draft**: several fields are flagged as uncertain (see below) and haven't been confirmed by the user. Treat `app/src/data/cards.json` as provisional; it's a direct copy of `data/cards-draft.json` (no build script syncs them — edit both or write one when the data is finalized).

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

## UI direction (decided 2026-08-20, built same day)

Rejected a flat grid/list of all 10 cards in favor of an issuer-grouped structure:

- **One route per issuer**: `/amex`, `/chase`, `/capital-one`, `/bank-of-america`, `/citi`, `/wells-fargo` (route slugs and display names live in `app/src/constants.js`'s `ISSUERS` array — add an issuer there and it automatically gets a route, nav link, and home-page tile). Each route (`app/src/pages/IssuerPage.jsx`) shows a **comparison chart** (`app/src/components/ComparisonChart.jsx`) of that issuer's cards when there are 2+, e.g. the Amex page compares Platinum vs. Gold row-by-row across annual fee, tier, points program, top earning rates, perks, transfer-partner count.
- **Tabs below the chart** (`app/src/components/CardTabs.jsx`) let the user click a card name to swap in that card's full detail panel (`app/src/components/CardDetail.jsx` — all perks, partnerships, points system, plus any `flags`) without leaving the page. Transfer partners (airlines/hotels) render as individual chips with a count in the label (e.g. "Airline transfer partners (17)"), not a comma-joined line — long partner lists were hard to scan as prose. Reuses the same `.chip` pill style as the tier lineup for visual consistency.
- **A separate cross-issuer compare tool** at `/compare` (`app/src/pages/ComparePage.jsx`) lets the user checkbox-select 2–4 cards from *any* issuer and reuses the same `ComparisonChart`/`CardTabs`/`CardDetail` components.
- **Citi and Wells Fargo currently have only one card each** in the dataset, so their issuer pages fall back to a single-card notice + detail panel instead of a comparison chart (handled automatically by `IssuerPage.jsx`'s `issuerCards.length` check — no special-casing needed elsewhere). Comparison charts for those issuers will appear automatically once a second card is added to `cards-draft.json`/`cards.json` for that issuer.
- Home page (`/`, `app/src/pages/Home.jsx`) is a hub: tiles linking to each issuer (showing card count + names) plus a CTA to `/compare`.

Design tokens (IBM Plex Sans/Serif/Mono, the "ledger" color palette) are shared between the original `data/cards-review.html` review page and the live app's `app/src/index.css`, so the two look/feel consistent.

## Next steps (when resuming this project)

1. Walk through `data/cards-review.html` (or the live app itself) with the user and resolve the flagged items above — either by direct confirmation or a fresh round of research. Once confirmed, update both `data/cards-draft.json` and `app/src/data/cards.json` (currently identical copies).
2. Consider researching the sibling Citi Strata ($0) and Citi Strata Elite ($595) cards (already named in the existing `citi-strata-premier` entry's `tier.lineup`) so Citi gets a real comparison chart — same idea for a second Wells Fargo card if desired.
3. Revisit card scope later if the user wants more cards, business cards, or non-US issuers — deliberately out of scope for this first pass.
4. No automated tests exist yet. Verification so far has been manual: `npm run lint` (oxlint, clean) plus interactive checks in the Browser pane (chart rendering, tab switching, cross-issuer compare, light/dark theme).

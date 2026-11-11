# Design System — PF Generator v0.2.0

Source: ErChulo/pbgc-design-system, `tokens/tokens.json` (single
source of truth). Fetched 2026-11-11.

- Version: **v1.1.0 DRAFT** — last updated 2026-11-07, NOT approved.
  For COLA / Section 508 review. Do not treat as approved.
- Tokens file SHA (git blob): `49e4c3c9e2a41bbe50bea204ea71a7d427843ac2`
  (verified by `git hash-object` on the saved copy).
- Latest commit at fetch time: `84a7149d112ef26fcf1e5656b017b9e54f863cb2`
  (2026-11-08, "Add Badge, Accordion, SearchBar, and Footer").
- Local copy: `docs/tokens.json` (byte-identical to the repo file).

## Tokens applied in pf-generator.html

- Brand blue `#002D72` (Pantone 288 C) — primary buttons, header bar, links.
- Brand red `#E4002B` — accent only, never error.
- Hover / focus ring `#004B8D`.
- Error `#B3001B`, tint `#FDECEF`. Warning `#8A5700`, tint `#FFF4D6`.
  Success `#008065`, tint `#E6F2EF`. Info tint `#EAF0F8`.
- Ink `#1A1A1A`. Grays `#58585B` / `#D2D2D2` / `#E0E0E0` / `#F2F2F2`.
- Font: `"Helvetica Neue", Arial, sans-serif` (Public Sans withdrawn —
  contradicted the brand, could not load offline).
- H1 2.25rem / H2 1.75rem / H3 1.375rem / body 1rem / small 0.875rem.
- Weights 400 / 700 only. Prose max 60ch.
- Focus: 3px solid, 2px offset, never box-shadow. Radius 4px.
- 8-point grid. Container max 1400px (token value).
- CSS transitions only 150 / 250ms. WCAG target 2.2 AA.

## Dark theme (toggle in the header)

- Toggle button in the header: ☾ Dark / ☀ Light. Sets
  `data-theme="dark"` on `<html>`. Choice saved in localStorage
  (`pf-theme`); no saved choice means light. Blocked storage never
  kills the app (all access through `pfSafeStorage()`).
- Page background **#000** — user override of the provisional night-0
  `#0B1B36`. All other dark values follow the resolved provisional
  tokens: subtle bg night-1 `#12294D`; text `#F2F2F2` / muted `#D2D2D2`;
  link blue-1 `#BEC6DF`; borders night-2 `#1B3866`, input blue-2
  `#8B9FC7`; primary button blue-1 `#BEC6DF` on blue `#002D72`.

## Header

- Slim blue header, compact title. No logo in v0.2.0 (see
  OPEN_ITEMS.md). The DEL generator embeds the white PBGC logo; PF
  will reuse that approach when the logo is added.
- Nav: links, not buttons. Three links: PF generator, Welcome, Help.
  Hash routing (`#pf`, `#welcome`, `#help`). Skip link first.
  Disclosure menu with Escape + focus return at the 640px breakpoint.

## What v0.2.0 does not use

- No Match ranking view (PF has no ranking step; DEL has one).
- No logo image yet. Text header only.

# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.2.0] - 2026-10-24

### Added

- **✦ Copilot panel** for [HireFlow Copilot](https://github.com/AutumnTrace/hireflow-copilot) (Claude agent + RAG over HireFlow):
  - Answers render a safe Markdown subset with `[n]` citation markers; clicking one opens the cited source, which links to its job or candidate page.
  - Tool calls and cost are shown under each answer.
  - Proposed stage changes get an **Apply** button that runs `moveApplication` with the app's own session. In live mode it then asks the copilot to re-index.
  - **Demo mode** replays real recorded answers about the demo dataset, labelled with the recording date and model. **Live API** mode calls a copilot at a configurable URL.
- *Copilot URL* in the Live API settings (`VITE_COPILOT_URL`, default `http://localhost:8000`)
- `scripts/export-demo-data.ts` exports the demo dataset for the copilot, so recorded ids match the board.

## [1.1.0] - 2026-10-22

### Changed

- **New visual design** ("Industry"): full-width navy masthead with condensed uppercase titles, Barlow / Barlow Condensed type (bundled via Fontsource), steel-blue accent, hairline rules and blueprint corner marks. Light and dark themes were retuned from the same tokens.
- Top navigation replaces the sidebar. Filters and search moved into the masthead.
- Job detail: numbered stage counters with stage-to-stage conversion replace the bar chart. Board cards show a 5-segment skill-match bar, matched skills, the next interview and days in stage.
- Stage badges use the steel palette, with the stage name always shown as text.

### Added

- *Stalled* flag on cards untouched for more than 7 days
- Staggered entrance and hover-lift motion, disabled under `prefers-reduced-motion`

## [1.0.0] - 2026-10-22

First release, built against [HireFlow API v1.1.1](https://github.com/AutumnTrace/hireflow/releases/tag/v1.1.1).

### Added

- Job board with search, work-mode/status filters and cursor pagination
- Job detail page with stat tiles, a "where applicants are now" bar chart and a live activity feed
- Drag-and-drop **pipeline board** (dnd-kit) that highlights valid target columns, plus an accessible "Move to…" menu on every card
- Typed API errors (e.g. `InvalidStageTransitionError`) shown to the user when a move is rejected
- Live updates over GraphQL subscriptions (`graphql-ws`)
- Candidate list and profiles with skill-match meters, stage history and recommended jobs
- Interview agenda and recent feedback
- **Two data sources:** Live API (signs in through the dev token endpoint) or Demo mode, which runs the HireFlow schema in the browser
- End-to-end typed GraphQL documents generated from the API schema (GraphQL Code Generator)
- Light/dark/system theme
- Vitest + Testing Library unit tests, Playwright end-to-end tests (desktop and mobile)
- CI and automatic deployment of the demo to GitHub Pages

[Unreleased]: https://github.com/AutumnTrace/hireflow-web/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/AutumnTrace/hireflow-web/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/AutumnTrace/hireflow-web/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/AutumnTrace/hireflow-web/releases/tag/v1.0.0

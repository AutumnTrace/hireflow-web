<div align="center">

# 🧭 HireFlow Web

**A recruiter's pipeline board for the [HireFlow GraphQL API](https://github.com/AutumnTrace/hireflow): drag candidates through hiring stages, watch changes arrive live, and see who fits which role.**

Built with **React 19**, **TypeScript**, **urql** and **GraphQL Code Generator**.

[![CI](https://github.com/AutumnTrace/hireflow-web/actions/workflows/ci.yml/badge.svg)](https://github.com/AutumnTrace/hireflow-web/actions/workflows/ci.yml)
[![Deploy](https://github.com/AutumnTrace/hireflow-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/AutumnTrace/hireflow-web/actions/workflows/deploy.yml)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)
![GraphQL](https://img.shields.io/badge/GraphQL-urql%20%2B%20codegen-E10098?logo=graphql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-25%20unit%20%C2%B7%2012%20e2e-brightgreen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

### [▶ Try the live demo](https://autumntrace.github.io/hireflow-web/)

<sub>Runs entirely in your browser. No sign-up, no server.</sub>

</div>

<p align="center">
  <img src="docs/screenshots/pipeline-light.png" alt="Job detail page with applicant stats, a bar chart of applicants per stage, a live activity feed and a seven-column pipeline board" width="100%">
</p>

---

## ✨ Highlights

| | |
|---|---|
| 🗂️ **Drag-and-drop pipeline** | Move candidates between stages with [dnd-kit](https://dndkit.com). Valid target columns light up while you drag; invalid ones dim. |
| 🧯 **Server-driven rules** | The board doesn't hard-code the hiring rules. Each card carries `allowedNextStages` from the API, and an illegal drop shows the API's own typed `InvalidStageTransitionError`. |
| 📡 **Live updates** | A GraphQL **subscription** over `graphql-ws` pushes stage changes; open two tabs and watch one update the other. |
| 🔒 **End-to-end types** | Every query is checked against the API's `schema.graphql` at build time, and the results are fully typed. CI fails if the generated types drift. |
| 🎯 **Skill matching** | Candidate profiles show skill-match meters per application and ranked job recommendations from the API. |
| 🧪 **Demo mode** | The real HireFlow schema executes **in the browser** against sample data, so the public demo works without a backend while using the same operations, paging, filtering and errors. |
| ♿ **Accessible** | Every drag has a keyboard/menu alternative; columns, meters and charts carry labels and a screen-reader table. |
| 🌗 **Light & dark** | Semantic colour tokens with a system/light/dark toggle. |

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/drag-dark.png" alt="Dark mode: dragging a card; allowed columns are outlined, the hovered invalid column is red"></td>
    <td width="50%"><img src="docs/screenshots/candidate.png" alt="Candidate profile with skill-match bars, matched and missing skills, stage history and recommended jobs"></td>
  </tr>
  <tr>
    <td align="center"><sub>Dragging: allowed stages are outlined, the invalid target turns red</sub></td>
    <td align="center"><sub>Candidate profile: skill match, history, recommendations</sub></td>
  </tr>
</table>

## 🚀 Quick start

```bash
git clone https://github.com/AutumnTrace/hireflow-web.git
cd hireflow-web
npm install
npm run dev
```

Open http://localhost:5173. It starts in **Demo mode**, with nothing else to run.

### Connect to the real API

1. Run the [HireFlow API](https://github.com/AutumnTrace/hireflow) on port 5230:
   ```bash
   dotnet run --project src/HireFlow.Api --launch-profile http
   ```
2. In the web app, click **Demo data ⚙** → **Live API** → leave the URL empty → **Save**.

The Vite dev server proxies `/graphql` (HTTP and WebSocket) and `/auth` to the API, so no CORS setup is needed in development. The app signs in through the API's development token endpoint as a demo recruiter.

> To point at an API on another origin, enter its URL in settings and add this site to the API's `Cors:AllowedOrigins`.

## 🏗 How it works

```mermaid
flowchart LR
    subgraph browser["Browser"]
        ui["React pages<br/>(jobs · pipeline · candidates · interviews)"]
        urql["urql client<br/>document cache"]
        ui -- "typed documents<br/>(codegen)" --> urql
    end

    subgraph live["Live API mode"]
        api["HireFlow API<br/>.NET 10 · Hot Chocolate"]
    end

    subgraph demo["Demo mode"]
        exec["executeExchange"]
        schema["HireFlow schema.graphql<br/>+ in-memory resolvers"]
        exec --> schema
    end

    urql -- "HTTP queries & mutations" --> api
    urql -- "graphql-ws subscriptions" --> api
    urql -. "same operations,<br/>no network" .-> exec
```

- **One contract.** `schema.graphql` is synced from the API repo (`npm run schema:pull`). Codegen checks every operation against it, and demo mode executes the *same SDL*, so demo and live behaviour can't drift silently.
- **Demo backend** ([`src/demo`](src/demo)): `@graphql-tools/schema` makes the SDL executable over a deterministic dataset. A small interpreter ([`query.ts`](src/demo/query.ts)) implements Hot Chocolate's `where`/`order`/cursor-paging conventions, and the resolvers mirror the API's state machine and typed errors. It's lazy-loaded, so live mode never downloads it.
- **Moves** call the `moveApplication` mutation. Valid moves update the card immediately, then the job is refetched for fresh funnel counts. If the API returns a typed error, the card snaps back and a toast shows the server's message.

## 🔬 Things I found by testing against the real API

Building the client surfaced two real API issues, which were fixed upstream:

- **[hireflow#9](https://github.com/AutumnTrace/hireflow/pull/9):** Hot Chocolate had inferred a domain method as a query field (`JobApplication.moveTo`). Code generation exposed it. Also added CORS for browser clients.
- **[hireflow#10](https://github.com/AutumnTrace/hireflow/pull/10):** filtered queries that pass `where` as a **variable** were rejected by cost analysis (cost 4,777 vs. a 1,000 limit). Hot Chocolate prices filter variables at 5× their worst case. The fix tunes the multiplier and budget, with regression tests that replay this app's queries.

The job board also requests a fixed page size (`first: 12`, with **Load more**) so the server can price each request accurately.

## 📁 Project structure

```
src/
├── api/              # Data source settings, live urql client (HTTP + graphql-ws), dev sign-in
├── demo/             # In-browser HireFlow: dataset, executable schema, filter/sort/paging interpreter
├── features/
│   ├── jobs/         # Job board, job detail, pipeline board, chart, live activity feed
│   ├── candidates/   # Candidate list, profile, skill-match meter
│   └── interviews/   # Agenda and recent feedback
├── components/       # Layout, settings dialog, toasts, UI primitives
├── lib/              # Stage metadata, formatting helpers
└── gql/              # Generated typed documents (do not edit)
e2e/                  # Playwright specs (desktop + mobile)
schema.graphql        # API contract, synced from AutumnTrace/hireflow
```

## ✅ Quality checks

| Command | What it runs |
|---|---|
| `npm run lint` | [oxlint](https://oxc.rs) with React, a11y and Vitest rules |
| `npm run typecheck` | TypeScript (strict) |
| `npm test` | Vitest + Testing Library: demo schema rules, filter/paging interpreter, board behaviour, job board against the demo API |
| `npm run test:e2e` | Playwright against the production build: real mouse drags, illegal-move errors, filters, profiles, settings, mobile viewport |
| `npm run codegen` | Regenerate typed documents (CI fails if `src/gql` is stale) |
| `npm run schema:pull` | Fetch the latest API schema and regenerate |

CI runs all of the above on every PR, and every push to `main` deploys the demo to GitHub Pages.

## 🗺 Roadmap

- [ ] Candidate and job creation forms (`registerCandidate`, `createJobPosting`)
- [ ] Schedule interviews from a card
- [ ] Optimistic updates through urql Graphcache
- [ ] Real OIDC sign-in, replacing the dev token endpoint

## 📄 License

[MIT](LICENSE) © Mina Rotari

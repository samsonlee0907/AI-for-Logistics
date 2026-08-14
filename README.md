# Logistics AI Control Tower

A polished client portal with exactly three cohesive shipping/logistics demonstrations:

1. **Dynamic Freight Pricing Control Tower** — an explainable lane-rate recommendation with factor contributions, confidence, guardrails, audit evidence, and advisory market context.
2. **Vessel Network Disruption Recovery** — deterministic AIS/progress, port, weather, closure simulation and reroute comparison.
3. **Empty Container Utilization Across Ports** — capacity-aware equipment imbalances and ranked repositioning moves.

> This is a **synthetic demonstration**, not a production pricing, navigation, dispatch, or equipment-release system. Operational math is deterministic and inspectable. AI can provide a tightly bounded, audited pricing signal but cannot create an unconstrained quote or bypass commercial guardrails.

## Quick start

Requires Node.js 20 or later.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:3000`. Use `npm start` for a normal server process, `npm test` for focused deterministic tests, and `npm run lint` for JavaScript syntax checks.

## Architecture

```text
public/                 Responsive vanilla client dashboard
src/
  services/             Deterministic pricing, route recovery, equipment calculations
  fixtures/             Repeatable, visibly synthetic scenario inputs
  providers/            Server-only Web IQ and Foundry adapters
  schemas/              Zod input and structured-brief contracts
  config/               Ignored local provider settings handling
docs/scenarios/         Per-scenario calculation and safety documentation
tests/                  Node built-in focused service/config tests
```

`src/app.js` is the Express API and static-server composition root. Each scenario starts with deterministic operational facts and passes only those facts plus indexed Web IQ citations to Foundry. GPT-5.6-Terra returns a validated reasoning trace and source selections. For pricing, it also proposes bounded market/disruption signals; for vessel recovery and equipment utilization, it can select only from the already-calculated viable routes or ranked moves. The client displays the selected evidence, reasoning trace, freshness, and operator handoff.

## Provider configuration

The **Configuration** control stores only Web IQ values in `config/local-settings.json`, which is ignored by Git. Browser status responses disclose only `enabled`, `configured`, and `mode`; they never disclose provider endpoint URLs or secrets. Blank key fields retain an existing local secret.

## Portal access

The portal is protected by a custom sign-in page and a server-validated, signed, HTTP-only session cookie. Set `PORTAL_AUTH_USERNAME`, `PORTAL_AUTH_PASSWORD`, and a random `PORTAL_AUTH_SESSION_SECRET` (at least 32 characters) in local environment configuration or the hosting platform's secret store. Do not commit these values. The health endpoint remains unauthenticated for hosting checks; the portal and all operational APIs require a valid session.

### Web IQ

Default environment variables:

```text
WEBIQ_BASE_URL=https://api.microsoft.ai/v3
WEBIQ_API_KEY=
WEBIQ_ENABLED=false
```

When `WEBIQ_ENABLED=false` (the default), scenarios use synthetic data alone and show no external citations. When enabled, the server uses `x-apikey` server-side to retrieve latest scenario news from `/v3/search/news` plus scenario-specific web context from `/v3/search/web` (including origin and destination weather for vessel recovery). Live errors are returned explicitly and are never converted into mock success. Use the configuration test control to validate a live connection before a scenario request.

### Foundry / Azure OpenAI

```text
FOUNDRY_ENDPOINT=
FOUNDRY_DEPLOYMENT=
```

Foundry is embedded rather than browser-configurable. In Azure Container Apps the server uses `DefaultAzureCredential`, which resolves to the app's system-assigned managed identity; the identity must have the **Cognitive Services OpenAI User** role on the Foundry resource. The server validates structured model responses with Zod and accepts only source indexes it supplied. For freight pricing it accepts separate market and disruption signals of -150 to +150 basis points each, clamps their combined effect to +/-300 basis points, then recalculates published guardrails. For recovery and utilization it rejects any AI-selected route or move not present in the deterministic option set. Invalid model output or a live failure leaves the deterministic baseline visible with an explicit unavailable status.

## Deployment

Deploy as a Node 20+ web service with `npm ci` and `npm start`, or build the included `Dockerfile`. The Azure deployment uses an external Azure Container App with `FOUNDRY_ENDPOINT` and `FOUNDRY_DEPLOYMENT` as non-secret environment variables and a system-assigned managed identity for OpenAI inference. Grant only **Cognitive Services OpenAI User** on the Foundry account. Run behind HTTPS, restrict Web IQ configuration access in a production adaptation, and use a managed identity or secret manager instead of local settings. This demo intentionally has no database or live operational feed.

## Standards references

- [IMO Just in Time Arrival](https://greenvoyage2050.imo.org/just-in-time/) and [Maritime Single Window](https://www.imo.org/en/OurWork/Facilitation/Pages/MSW.aspx)
- [DCSA Track & Trace](https://dcsa.org/standards/track-trace/) and [Port Call](https://dcsa.org/standards/port-call/)
- [GS1 EPCIS 2.0](https://www.gs1.org/standards/epcis)
- [Microsoft Learn MLOps](https://learn.microsoft.com/azure/machine-learning/concept-model-management-and-mlops)

See [`docs/scenarios`](docs/scenarios) for each scenario's inputs, equations, evidence model, guardrails, mock data disclosures, and source links.

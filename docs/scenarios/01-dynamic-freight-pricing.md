# Dynamic Freight Pricing Control Tower

> **Synthetic demonstration only.** This is not a production pricing system. The final recommendation remains guardrail-controlled and requires commercial approval where indicated.

## Inputs and deterministic calculation

The scenario prices a synthetic Shanghai-to-Rotterdam 40HC lane from a fixed base rate. It adds or subtracts stated contributions for lane demand forecast, available capacity, equipment type, lane imbalance, port congestion, schedule reliability, bunker/fuel proxy, empty repositioning cost, carbon proxy, service commitment, competitor/market context, and a disruption context flag. The service exposes each contribution and uses a fixed floor/ceiling percentage guardrail around the recommendation.

The decision audit carries the calculation identifier, method, assumptions, model-signal status, and guardrail decision. All quantities, congestion values, market indices, costs, and rate inputs are synthetic and repeatable.

## External intelligence and model roles

Web IQ can return cited market or disruption context as `title`, `URL`, `snippet`, `timestamp`, and `source type`. When disabled, no external evidence is shown. When enabled, citations are displayed as advisory evidence and passed to the server-side model only as indexed records; the model cannot invent a URL.

GPT-5.6-Terra receives the precomputed baseline and the indexed citations through the Container App managed identity. It returns a concise reasoning trace, source indexes, operator actions, and two bounded signals: market and disruption, each between -150 and +150 basis points. The server validates them, clamps their combined impact to +/-300 basis points, applies that amount to the deterministic baseline, and recalculates guardrails. The displayed final rate therefore shows a real, source-linked GPT decision input, not just narrative. It cannot set a free-form price, change deterministic inputs, invent citations, or bypass approval requirements. Operators must check citation freshness and commercial authority before acting.

## Standards and sources

- [IMO Just in Time Arrival](https://greenvoyage2050.imo.org/just-in-time/)
- [IMO Maritime Single Window](https://www.imo.org/en/OurWork/Facilitation/Pages/MSW.aspx)
- [DCSA Track & Trace](https://dcsa.org/standards/track-trace/)
- [Microsoft Learn MLOps guidance](https://learn.microsoft.com/azure/machine-learning/concept-model-management-and-mlops)

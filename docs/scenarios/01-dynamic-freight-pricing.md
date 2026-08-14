# Dynamic Freight Pricing Control Tower

> **Synthetic demonstration only.** This is not a production pricing system and no model or external web result can set a rate.

## Inputs and deterministic calculation

The scenario prices a synthetic Shanghai-to-Rotterdam 40HC lane from a fixed base rate. It adds or subtracts stated contributions for lane demand forecast, available capacity, equipment type, lane imbalance, port congestion, schedule reliability, bunker/fuel proxy, empty repositioning cost, carbon proxy, service commitment, competitor/market context, and a disruption context flag. The service exposes each contribution and uses a fixed floor/ceiling percentage guardrail around the recommendation.

The decision audit carries the calculation identifier, method, assumptions, and guardrail decision. All quantities, congestion values, market indices, costs, and rate inputs are synthetic and repeatable.

## External intelligence and model roles

Web IQ can return cited market or disruption context as `title`, `URL`, `snippet`, `timestamp`, and `source type`. In the default mock mode it returns clearly labelled simulated evidence. This evidence is displayed separately and never enters the rate arithmetic.

The embedded Foundry/Azure OpenAI deployment generates a concise structured operator brief from precomputed facts and citations through the Container App managed identity. It has no tool that can set a price, alter a contribution, or override guardrails.

## Standards and sources

- [IMO Just in Time Arrival](https://greenvoyage2050.imo.org/just-in-time/)
- [IMO Maritime Single Window](https://www.imo.org/en/OurWork/Facilitation/Pages/MSW.aspx)
- [DCSA Track & Trace](https://dcsa.org/standards/track-trace/)
- [Microsoft Learn MLOps guidance](https://learn.microsoft.com/azure/machine-learning/concept-model-management-and-mlops)

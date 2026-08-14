# Empty Container Utilization Across Ports

> **Synthetic demonstration only.** This is not a production equipment release, booking, or dispatch system.

## Inputs and deterministic calculation

The scenario holds repeatable synthetic port balances for 40HC, 40GP, and 20GP equipment at Shanghai, Singapore, Jebel Ali, Rotterdam, and Algeciras. It pairs positive balances with deficits, caps a candidate move by both synthetic terminal release capacities, and ranks candidates by a transparent cost, service, carbon objective.

The operator may select balanced, cost, or service prioritization. Every proposed move exposes unit count, distance, cost and carbon proxy, service points, and the binding capacity constraint. Equipment balances, network distances, utilization, and impacts are all synthetic.

## External intelligence and model roles

Web IQ supplies cited latest equipment news plus demand/restriction context. When live retrieval is off, the UI uses a fixed research snapshot captured on 15 August 2026 and labels it `Point-in-time snapshot`. The UI exposes the source type and freshness. Live failure remains visible to the client; it is never silently replaced with snapshot success. External evidence cannot alter balances, terminal capacity caps, or feasibility.

GPT-5.6-Terra reasons over calculated moves and indexed evidence through the Container App managed identity. It returns a validated reasoning trace and can select one existing move rank as the evidence-informed priority; that move is highlighted for the operator. It cannot create a new move, alter capacity constraints, or approve a repositioning order.

## Standards and sources

- [GS1 EPCIS 2.0](https://www.gs1.org/standards/epcis)
- [DCSA Track & Trace](https://dcsa.org/standards/track-trace/)
- [DCSA Port Call](https://dcsa.org/standards/port-call/)
- [Microsoft Learn MLOps guidance](https://learn.microsoft.com/azure/machine-learning/concept-model-management-and-mlops)

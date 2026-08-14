# Vessel Network Disruption Recovery

> **Synthetic demonstration only.** This is not a production navigation or voyage instruction system.

## Inputs and deterministic calculation

The retained vessel scenario simulates AIS-style vessel progress for MV Horizon Relay, a Singapore port queue/closure curve, and weather escalation by elapsed simulation time. The UI advances in 15-minute, one-hour, or six-hour increments. At 20 simulation hours, the synthetic Singapore pilot suspension closes the port.

The deterministic route graph compares the planned Shanghai-Singapore-Jebel Ali-Rotterdam path with alternatives via Port Klang and Algeciras. Each option calculates nautical miles, transit time, a fuel proxy, cost, carbon, delay against a 732-hour plan, and a risk band. The option calculation is explicit: route distance plus per-segment weather penalty plus arrival port berth wait; cost uses fixed fuel and delay coefficients.

## External intelligence and model roles

Web IQ provides citation-ready latest maritime news plus origin and destination weather/port context. When live retrieval is off, the portal uses a fixed research snapshot captured on 15 August 2026, visibly labeled `Point-in-time snapshot`; it must not substitute for live marine or port notices. The portal displays the source type and freshness so an operator can judge whether it remains decision-relevant. It does not modify distances, vessel state, risk, cost, carbon, or feasibility calculations.

GPT-5.6-Terra reasons over the calculated trade-offs and the indexed citations, then returns a validated trace and can select one route identifier from the deterministic alternatives as its evidence-informed recommendation. The selected route is highlighted in the portal; an operator may select a different viable option. The model cannot create a route, issue a sailing order, or replace marine operational controls.

## Standards and sources

- [DCSA Port Call](https://dcsa.org/standards/port-call/)
- [DCSA Track & Trace](https://dcsa.org/standards/track-trace/)
- [IMO Maritime Single Window](https://www.imo.org/en/OurWork/Facilitation/Pages/MSW.aspx)
- [IMO Just in Time Arrival](https://greenvoyage2050.imo.org/just-in-time/)

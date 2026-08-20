# Demo script — Logistics AI Control Tower

A presenter's runbook for a live, ~12–15 minute walkthrough of the portal's three use cases. Written for an audience with **no prior logistics/shipping background** — each scenario opens with a plain-language primer before the click-by-click walkthrough.

Assumes the presenter is already signed in and the dashboard is open. Keep the framing consistent throughout: **all operational numbers are deterministic and synthetic; GPT-5.6-Terra adds bounded, cited reasoning on top — it never invents facts or bypasses guardrails.**

Opening line:
> "This is a client-facing control tower with three logistics AI demos. Everything you'll see runs on deterministic, auditable math — GPT-5.6-Terra sits alongside it as an advisory reasoning layer, grounded in cited evidence, never a black box making the call."

---

## 0. Orient on the dashboard (30 seconds)

- Point out the left-hand navigation: **01 Freight pricing**, **02 Vessel recovery**, **03 Empty utilization** — three cohesive scenarios, one shared design language.
- Point out the **SYNTHETIC DATA** badge in the top bar — this label persists on every screen; nothing here is a live commercial system.

---

## 1. Scenario 1 — Dynamic Freight Pricing Control Tower (5–6 minutes, the flagship)

### Background the audience needs first

In ocean shipping, a **"lane"** is a shipping corridor between an origin and destination port (e.g., China → Europe). Carriers must quote a rate for moving cargo on a lane, and that rate should reflect real market conditions, not guesswork. Plain-language definitions for what's on screen:

- **Lane demand forecast / Available capacity** — how much cargo wants to move on this lane vs. how much vessel space exists. More demand than space pushes price up; the reverse pushes it down.
- **Equipment type** (40HC / 40GP / 20GP) — the container size/type being priced (e.g., 40HC = 40-foot "high cube" container).
- **Service commitment** (Priority / Standard / Contract) — how firm the customer's booking guarantee is; tighter guarantees typically cost more.
- **External disruption signal** — a real-world event (port congestion, storm) that changes cost or risk on this lane.
- **Confidence** — how strongly the underlying data supports this recommendation.
- **Guardrails (Floor / Ceiling)** — the minimum and maximum price the business allows regardless of what any input or AI suggests — a safety rail, not a suggestion.
- **Basis points ("bps")** — a tiny unit of percentage (100 bps = 1%), used here to describe GPT's small, bounded nudge to the price.
- **Factor-level contributions** — a dollar-by-dollar breakdown of *why* the price is what it is (e.g., "+$85 for port congestion").

### Walkthrough

1. Read the scenario intro line aloud: *"Quote an explainable rate where GPT-5.6-Terra turns cited market intelligence into a bounded adjustment before commercial guardrails are applied."*
2. **Show the AI recommendation panel at the top** (*Evidence-informed GPT reasoning*):
   - Point out the headline, the rationale paragraph, and the **reasoning steps** list — this is GPT explaining its logic in plain language.
   - Point out **Applied decision input** — the exact bps adjustment GPT proposed and that was accepted.
   - Point out **Sources applied** at the bottom — cited, clickable evidence links (or a dated snapshot label if live web intelligence is off).
3. **Move to the KPI strip:** "Deterministic baseline," "GPT market signal," "Evidence-informed change," "Guardrail headroom." Explain: the deterministic engine computes a baseline first; GPT's signal is layered on afterward and is always visibly separated.
4. **Adjust the controls** — drag Lane demand forecast and Available capacity sliders, change Equipment, change Service commitment, change External disruption signal. Click **Recalculate recommendation**.
   - Narrate: watch the recommended rate, confidence meter, and factor list all update live.
5. **Scroll to Factor-level contributions:** call out 2–3 factors by name and their dollar contribution — this is the full audit trail behind the number.
6. **Scroll to Decision evidence:** read the disclosure line: *"GPT-5.6-Terra can apply a cited, bounded market/disruption signal. The server validates it, limits it to ±300 bps, then recalculates guardrails."*
7. **Scroll to External intelligence:** show the evidence cards (title, source type, freshness, snippet, "Open source ↗").

**Key message to land:** "GPT reasons over the same evidence a human analyst would — market news, disruption signals — and proposes a bounded nudge. It cannot override the guardrails or invent a number; the server clamps and re-validates everything it returns."

---

## 2. Scenario 2 — Vessel Network Disruption Recovery (4–5 minutes)

### Background the audience needs first

Ocean cargo travels on **vessels** following a **planned route** between ports. Real-world events — storms, a congested or closed port — can force a **reroute**. Plain-language definitions for what's on screen:

- **AIS** (Automatic Identification System) — the industry-standard GPS-like tracking signal every commercial vessel broadcasts, showing its live position, speed, and next port. It's how the shipping industry "sees" ships at sea.
- **Port congestion** — how backed up a port is; a high percentage means ships queue longer before they can dock.
- **Berth wait** — the number of hours a vessel waits at anchor before a dock ("berth") is free.
- **Weather penalty** — how much a storm is expected to slow the ship down or add risk.
- **Disruption severity** (low / medium / high / severe) — a simple traffic-light label summarizing how bad current conditions are.
- **Reroute options** — alternative paths that avoid the disrupted port, each with its own trade-offs.
- **Transit hours / Delay** — total sailing time for a route, and how much longer that is than the original plan.
- **Carbon proxy** — an estimated CO₂ emissions figure calculated from fuel burn, used as a stand-in for real emissions telemetry.
- **Risk** — a simple label (low/medium/high/severe) capturing how exposed a route is to further disruption.

### Walkthrough

1. Click **02 Vessel recovery** in the nav.
2. Read the intro: *"Compare deterministic recovery trade-offs, then let GPT-5.6-Terra recommend a highlighted viable route using cited disruption and weather context."*
3. **Time controls:** click **+1 hour** or **+6 hours** a couple of times. Narrate: the simulation clock advances, and port congestion, berth wait, and weather penalty all worsen deterministically as time passes — this simulates a disruption escalating in real time.
4. **Route map:** point out the planned route (dashed) vs. the recommended/recovery route (animated gradient line), the vessel dot, and the "Route remains on plan" / "Recovery route diverts via …" badge.
5. **Reroute options:** show the ranked deterministic trade-offs — transit hours, cost, carbon, delay, risk badge. Point out the card marked **GPT-RECOMMENDED** — GPT selected this option from the deterministic list, it did not invent a new route.
6. **Manually override:** click a different route card. Narrate: the operator can always override the AI selection — this replaces "GPT-RECOMMENDED" with "SELECTED" and updates the map/timeline instantly.
7. **AI recommendation panel:** show the rationale, reasoning steps, and applied decision input (which route and why).
8. **External intelligence panel:** point out the context note — *"Latest shipping news plus origin and destination marine-weather citations. Context informs AI explanations only; it never changes route trade-offs."*

**Key message to land:** "Disruption and weather intelligence sharpens *why* GPT recommends a route, but the trade-off numbers — transit, cost, carbon, delay, risk — are always computed deterministically first."

---

## 3. Scenario 3 — Empty Container Utilization Across Ports (3–4 minutes)

### Background the audience needs first

Shipping containers don't automatically end up where they're needed next. After a container is unloaded, it's **empty** until it's loaded again — and empty containers pile up at import-heavy ports while export-heavy ports run short. Moving empty containers to where they're needed is called **repositioning**, and it costs money and vessel space with no direct revenue, so it must be done efficiently. Plain-language definitions for what's on screen:

- **Equipment type** (40HC / 40GP / 20GP) — the container size/type being balanced.
- **Surplus / Deficit** — a port has a *surplus* if it has more empty containers than nearby demand needs, and a *deficit* if it has fewer than needed.
- **Repositioning move** — shipping empty containers from a surplus port to a deficit port.
- **Ranked moves** — the deterministic engine's prioritized list of which move matters most, second most, and so on.
- **Prioritize: Balanced / Cost / Service** — lets the presenter show how the ranking shifts depending on whether the business cares more about total cost, service reliability, or a mix of both.
- **Constraint** — a plain-language reason why a move is capacity-feasible now, or limited (e.g., vessel space, distance, customs).

### Walkthrough

1. Click **03 Empty utilization** in the nav.
2. Read the intro: *"Rank capacity-feasible moves, then let GPT-5.6-Terra identify the move to prioritize using cited equipment and restriction context."*
3. Change **Equipment** and **Prioritize** (Balanced / Cost / Service), then click **Rank repositioning moves**.
4. **Equipment recovery flow:** point out the animated surplus → deficit flow visualization — a simple before/after picture of where containers move from and to.
5. **Equipment balance:** show the port-level surplus/deficit bars.
6. **Ranked moves:** point out the move marked with the **GPT priority** label and left accent — again, GPT chose from an already-ranked deterministic list.
7. **Prioritization evidence:** show the transparent constraint text per move (why each move is capacity-feasible or limited).
8. **External intelligence panel:** show equipment/restriction citations informing the AI panel's rationale only.

**Key message to land:** "Same pattern as the other two scenarios — deterministic ranking first, GPT explains and can prioritize within it, never outside it."

---

## 4. Wrap-up (30 seconds)

Closing line:
> "Three scenarios, one consistent pattern: deterministic, auditable operational math first; GPT-5.6-Terra layered on top with cited evidence, bounded influence, and a human handoff step. This is a synthetic demonstration, not a production pricing or navigation system — but the guardrail pattern is exactly what you'd want in production."

---

## Quick reference — talking points by theme

| Theme | Where to point |
|---|---|
| Deterministic baseline | KPI strip (pricing), route options / port balances (vessel, containers) |
| Bounded AI influence | "Applied decision input" line; ±300 bps clamp; route/move must exist in deterministic list |
| Explainability | Reasoning steps list, factor-level contributions, decision evidence audit |
| Cited external evidence | Evidence cards with source, freshness/snapshot date, snippet, link |
| Human-in-the-loop | "Acknowledge …" operator handoff button on every AI panel |
| Safety/guardrails | Guardrail floor/ceiling, approval line, synthetic-data badge, caution text |

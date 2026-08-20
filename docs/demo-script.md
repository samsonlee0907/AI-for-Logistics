# Demo script — Logistics AI Control Tower

A presenter's runbook for a live, ~12–15 minute walkthrough of the portal. Each step lists what to click, what to say, and what the audience should notice. Optional deeper cuts are marked "If time allows."

**Live URL:** `https://logistics-ai-control-tower.greenpebble-d9757289.southeastasia.azurecontainerapps.io`
**Credentials:** username and password are both `logistic-user-fy27!`

Keep the framing consistent throughout: **all operational numbers are deterministic and synthetic; GPT-5.6-Terra adds bounded, cited reasoning on top — it never invents facts or bypasses guardrails.**

---

## 0. Before you start (30 seconds)

- Open the URL in a fresh browser tab (or private window) so the sign-in page shows.
- Have the **Configuration** dialog test ready in case you want to demonstrate Web IQ live mode (optional, see step 6).
- One-line framing to open with:
  > "This is a client-facing control tower with three logistics AI demos. Everything you'll see runs on deterministic, auditable math — GPT-5.6-Terra sits alongside it as an advisory reasoning layer, grounded in cited evidence, never a black box making the call."

---

## 1. Sign in (30 seconds)

1. Show the **Sign in** page — point out the "Restricted client portal" framing and the notice that access is logged and data is synthetic.
2. Enter `logistic-user-fy27!` / `logistic-user-fy27!` and click **Sign in**.

**Talking point:** "Access is protected by a signed session cookie server-side — there's no client-side auth logic to bypass."

---

## 2. Orient on the dashboard (30 seconds)

- Point out the left-hand navigation: **01 Freight pricing**, **02 Vessel recovery**, **03 Empty utilization** — three cohesive scenarios, one shared design language.
- Point out the **SYNTHETIC DATA** badge in the top bar — call out that this label is persistent across every screen.
- Point out **Configuration** (top right) — this is where Web IQ live/mock mode is controlled; save it for step 6.

---

## 3. Scenario 1 — Dynamic Freight Pricing Control Tower (4–5 minutes, the flagship)

This is the scenario to spend the most time on.

1. **Set the scene.** Read the scenario intro line aloud: *"Quote an explainable rate where GPT-5.6-Terra turns cited market intelligence into a bounded adjustment before commercial guardrails are applied."*
2. **Show the AI recommendation panel at the top** (`Evidence-informed GPT reasoning`):
   - Point out the headline, the rationale paragraph, and the **reasoning steps** list — this is GPT explaining its logic in plain language.
   - Point out **Applied decision input** — the exact bps adjustment GPT proposed and that was accepted.
   - Point out **Sources applied** at the bottom — cited, clickable evidence links (or the point-in-time snapshot label if Web IQ is off).
   - Click **Acknowledge quote review** to show the human-in-the-loop handoff control.
3. **Move to the KPI strip:** "Deterministic baseline," "GPT market signal (bps)," "Evidence-informed change ($)," "Guardrail headroom." Explain: the deterministic engine computes a baseline first; GPT's signal is layered on afterward and is always visibly separated.
4. **Adjust the controls** — drag Lane demand forecast and Available capacity sliders, change Equipment (e.g., 40HC → 20GP), change Service commitment, change External disruption signal (e.g., select "Port congestion"). Click **Recalculate recommendation**.
   - Narrate: watch the recommended rate, confidence meter, and factor list all update live.
5. **Scroll to Factor-level contributions:** call out 2–3 factors by name (e.g., lane imbalance, port congestion, bunker/fuel proxy, emissions) and their dollar contribution — this is the full audit trail behind the number.
6. **Scroll to Decision evidence:** show the audit `<dl>` (decision label, guardrail math) and read the disclosure line: *"GPT-5.6-Terra can apply a cited, bounded market/disruption signal. The server validates it, limits it to ±300 bps, then recalculates guardrails."*
7. **Scroll to External intelligence:** show the evidence cards (title, source type, freshness/"captured" date, snippet, "Open source ↗"). Point out the badge — **LIVE CITATIONS**, **DATED SNAPSHOT**, or **OFF** depending on Web IQ mode.

**Key message to land:** "GPT reasons over the same evidence a human analyst would — market news, disruption signals — and proposes a bounded nudge. It cannot override the guardrails or invent a number; the server clamps and re-validates everything it returns."

---

## 4. Scenario 2 — Vessel Network Disruption Recovery (3–4 minutes)

1. Click **02 Vessel recovery** in the nav.
2. Read the intro: *"Compare deterministic recovery trade-offs, then let GPT-5.6-Terra recommend a highlighted viable route using cited disruption and weather context."*
3. **Time controls:** click **+1 hour** or **+6 hours** a couple of times. Narrate: the simulation clock advances, AIS-style vessel position, port congestion, berth wait, and weather penalty all update deterministically.
4. **Route map:** point out the planned route (dashed) vs. the recommended/recovery route (animated gradient line), the vessel dot, and the "Route remains on plan" / "Recovery route diverts via …" badge.
5. **Reroute options:** show the ranked deterministic trade-offs — transit hours, cost, carbon, delay, risk badge. Point out the card marked **GPT-RECOMMENDED** — GPT selected this option from the deterministic list, it did not invent a new route.
6. **Manually override:** click a different route card. Narrate: the operator can always override the AI selection — this replaces "GPT-RECOMMENDED" with "SELECTED" and updates the map/timeline instantly.
7. **AI recommendation panel:** show the rationale, reasoning steps, and applied decision input (which route and why).
8. **External intelligence panel:** point out the context note — *"Latest shipping news plus origin and destination marine-weather citations. Context informs AI explanations only; it never changes route trade-offs."* Show a weather-flavored citation if Web IQ is live or snapshot evidence is present.

**Key message to land:** "Disruption and weather intelligence sharpens *why* GPT recommends a route, but the trade-off numbers — transit, cost, carbon, delay, risk — are always computed deterministically first."

---

## 5. Scenario 3 — Empty Container Utilization Across Ports (2–3 minutes)

1. Click **03 Empty utilization** in the nav.
2. Read the intro: *"Rank capacity-feasible moves, then let GPT-5.6-Terra identify the move to prioritize using cited equipment and restriction context."*
3. Change **Equipment** (e.g., 40HC → 20GP) and **Prioritize** (Balanced / Cost / Service), then click **Rank repositioning moves**.
4. **Equipment recovery flow:** point out the animated surplus → deficit flow visualization.
5. **Equipment balance:** show the port-level surplus/deficit bars.
6. **Ranked moves:** point out the move marked with the **GPT priority** label and left accent — again, GPT chose from an already-ranked deterministic list.
7. **Prioritization evidence:** show the transparent constraint text per move (why each move is capacity-feasible or limited).
8. **External intelligence panel:** show equipment/restriction citations informing the AI panel's rationale only.

**Key message to land:** "Same pattern as the other two scenarios — deterministic ranking first, GPT explains and can prioritize within it, never outside it."

---

## 6. Configuration / Web IQ (1–2 minutes, optional deep cut)

1. Click **Configuration** (top right).
2. Explain the dialog: Web IQ is the only browser-configurable provider; Foundry/GPT is server-embedded via managed identity and isn't exposed here at all.
3. If you have a live Web IQ key: toggle **Enable live Web IQ**, paste the key, click **Test Web IQ**, show the success message, **Save Web IQ configuration**, then return to any scenario and show the evidence badge flip from **DATED SNAPSHOT** to **LIVE CITATIONS**.
4. If staying in mock mode: point out the dialog note — *"Only your API key is stored in ignored local server config… status endpoints never return secrets or endpoint URLs."* Close the dialog.

**Key message to land:** "Web IQ is fully optional and additive. With it off, the portal still has dated, clearly-labeled evidence to reason over — nothing is ever silently downgraded to fake 'live' data."

---

## 7. Wrap-up (30 seconds)

- Click **Sign out** to show the session ends cleanly.
- Closing line:
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
| Secure configuration | Configuration dialog note on ignored local config and no secret disclosure |

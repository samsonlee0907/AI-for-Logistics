import { pricingBase } from "../fixtures/data.js";

const equipmentAdjustments = { "40HC": 0, "40GP": -110, "20GP": -340 };
const serviceAdjustments = { standard: -90, priority: 130, contract: -40 };
const disruptionAdjustments = { none: 0, weather: 145, "port-congestion": 210 };

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function calculateFreightPrice(input = {}) {
  const values = { ...pricingBase, ...input };
  const demandIndex = input.demandIndex ?? values.demandIndex;
  const capacityIndex = input.capacityIndex ?? values.capacityIndex;
  const demandCapacity = Math.round((demandIndex - 100) * 11 + (100 - capacityIndex) * 13);
  const laneImbalance = Math.round(values.laneImbalance * 420);
  const congestion = Math.round(values.portCongestion * 340);
  const reliability = Math.round((1 - values.scheduleReliability) * 260);
  const bunker = Math.round((values.bunkerIndex - 1) * 760);
  const repositioning = values.emptyCost;
  const emissions = values.carbonCost;
  const market = Math.round((values.competitorIndex - 1) * 300);
  const equipment = equipmentAdjustments[input.equipment || "40HC"];
  const service = serviceAdjustments[input.serviceTier || "priority"];
  const disruption = disruptionAdjustments[input.disruption || values.disruption];
  const factors = [
    ["Demand / capacity", demandCapacity, "Lane forecast and available slot proxy"],
    ["Equipment", equipment, "Synthetic equipment scarcity proxy"],
    ["Lane imbalance", laneImbalance, "Export / import directional imbalance"],
    ["Port congestion", congestion, "Berth and terminal queue proxy"],
    ["Schedule reliability", reliability, "Recovery buffer for lower reliability"],
    ["Bunker / fuel", bunker, "Synthetic bunker index adjustment"],
    ["Empty repositioning", repositioning, "Empty equipment recovery cost"],
    ["Carbon", emissions, "Synthetic emissions cost proxy"],
    ["Service commitment", service, "Tier and customer commitment"],
    ["Competitor context", market, "Synthetic market context index"],
    ["External disruption", disruption, "Advisory context only; not a live feed"]
  ].map(([label, value, rationale]) => ({ label, value, rationale }));
  const rawRecommendation = Math.round(values.baseRate + factors.reduce((sum, factor) => sum + factor.value, 0));
  const recommendation = clamp(rawRecommendation, 2350, 3900);
  const confidence = clamp(Math.round(91 - Math.abs(demandIndex - 112) / 3 - Math.abs(capacityIndex - 86) / 4 - (input.disruption === "weather" ? 5 : 0)), 72, 94);
  const guardrails = {
    floor: Math.round(recommendation * 0.92 / 10) * 10,
    ceiling: Math.round(recommendation * 1.08 / 10) * 10,
    approval: recommendation > 3300 ? "Commercial approval required" : "Planner delegation available"
  };
  return {
    scenario: "Dynamic Freight Pricing Control Tower",
    synthetic: true,
    lane: values.lane,
    currency: values.currency,
    recommendation,
    confidence,
    guardrails,
    factors,
    audit: {
      calculationId: `PRC-${demandIndex}-${capacityIndex}-${input.equipment || "40HC"}`,
      deterministicMethod: "base rate + stated factor contributions, then published guardrails",
      decision: recommendation <= guardrails.ceiling ? "Recommend quoted price inside guardrail" : "Escalate",
      assumptions: ["Synthetic data only", "External intelligence is context, never a price input", "No model executes pricing"]
    }
  };
}

export function applyPricingAdvisory(baseline, advisory) {
  if (!advisory || advisory.mode !== "live") {
    return {
      ...baseline,
      baselineRecommendation: baseline.recommendation,
      aiAdjustment: { mode: advisory?.mode || "unavailable", basisPoints: 0, amount: 0, rationale: advisory?.message || "No live model adjustment was available; the deterministic baseline remains published.", citedSources: [] }
    };
  }
  const basisPoints = clamp(advisory.marketBps + advisory.disruptionBps, -300, 300);
  const amount = Math.round(baseline.recommendation * basisPoints / 10000);
  const recommendation = clamp(baseline.recommendation + amount, 2350, 3900);
  const guardrails = {
    floor: Math.round(recommendation * 0.92 / 10) * 10,
    ceiling: Math.round(recommendation * 1.08 / 10) * 10,
    approval: recommendation > 3300 ? "Commercial approval required" : "Planner delegation available"
  };
  return {
    ...baseline,
    baselineRecommendation: baseline.recommendation,
    recommendation,
    guardrails,
    factors: [...baseline.factors, { label: "AI-reviewed market context", value: amount, rationale: `Bounded ${basisPoints} bps model signal; source-linked context cannot exceed +/-300 bps.` }],
    aiAdjustment: { mode: "live", basisPoints, amount, rationale: advisory.rationale, citedSources: advisory.citedSources },
    audit: {
      ...baseline.audit,
      deterministicMethod: "deterministic baseline + bounded, source-linked model signal + published guardrails",
      modelInput: `Model signal ${basisPoints >= 0 ? "+" : ""}${basisPoints} bps; independently clamped to +/-300 bps before guardrails.`,
      assumptions: [...baseline.audit.assumptions, "Model output is constrained to bounded market and disruption signals; it cannot set a free-form price."]
    }
  };
}

import test from "node:test";
import assert from "node:assert/strict";
import { applyPricingAdvisory, calculateFreightPrice } from "../src/services/pricing.js";
import { calculateVesselRecovery } from "../src/services/vessel.js";
import { calculateContainerMoves } from "../src/services/containers.js";
import { publicProviderStatus } from "../src/config/settings.js";

test("freight pricing is deterministic, explainable, and guarded", () => {
  const input = { demandIndex: 125, capacityIndex: 78, equipment: "40HC", serviceTier: "priority", disruption: "port-congestion" };
  const first = calculateFreightPrice(input);
  const second = calculateFreightPrice(input);
  assert.deepEqual(first, second);
  assert.ok(first.recommendation >= first.guardrails.floor);
  assert.ok(first.recommendation <= first.guardrails.ceiling);
  assert.equal(first.factors.length, 11);
  assert.match(first.audit.deterministicMethod, /factor contributions/);
});

test("pricing model signals are bounded and remain inside deterministic guardrails", () => {
  const baseline = calculateFreightPrice({ demandIndex: 125, capacityIndex: 78, equipment: "40HC", serviceTier: "priority", disruption: "port-congestion" });
  const result = applyPricingAdvisory(baseline, { mode: "live", marketBps: 150, disruptionBps: 150, rationale: "Bounded review.", citedSources: [] });
  assert.equal(result.aiAdjustment.basisPoints, 300);
  assert.ok(result.recommendation <= 3900);
  assert.ok(result.recommendation >= result.guardrails.floor);
  assert.ok(result.recommendation <= result.guardrails.ceiling);
});

test("vessel recovery escalates a deterministic closure and retains alternatives", () => {
  const baseline = calculateVesselRecovery(0);
  const escalated = calculateVesselRecovery(20 * 60);
  assert.equal(baseline.options.length, 3);
  assert.equal(escalated.disruption.type, "Port closure");
  assert.equal(escalated.signals.closure, true);
  assert.ok(escalated.options.every((option) => option.cost > 0 && option.carbon > 0));
  assert.ok(escalated.options.some((option) => !option.route.includes("SGSIN")));
});

test("container utilization produces capacity-aware ranked moves", () => {
  const result = calculateContainerMoves({ equipment: "40HC", priority: "balanced" });
  assert.equal(result.moves.length, 4);
  assert.deepEqual(result.moves.map((move) => move.rank), [1, 2, 3, 4]);
  assert.ok(result.moves.every((move) => move.units > 0 && move.units <= 0.65 * 500));
  assert.ok(result.ports.some((port) => port.balance < 0));
  assert.ok(result.ports.some((port) => port.balance > 0));
});

test("provider status never exposes server endpoints or secrets", () => {
  const status = JSON.stringify(publicProviderStatus());
  assert.equal(status.includes("apiKey"), false);
  assert.equal(status.includes("endpoint"), false);
});

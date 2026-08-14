import test from "node:test";
import assert from "node:assert/strict";
import { applyPricingAdvisory, calculateFreightPrice } from "../src/services/pricing.js";
import { calculateVesselRecovery } from "../src/services/vessel.js";
import { calculateContainerMoves } from "../src/services/containers.js";
import { publicProviderStatus } from "../src/config/settings.js";
import { webIqQueries } from "../src/providers/webiq.js";
import { createPortalAuth } from "../src/auth/portal-auth.js";
import { resolveScenarioDecision } from "../src/providers/foundry.js";

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

test("vessel Web IQ plan retrieves current disruption and terminal weather context", () => {
  const vessel = calculateVesselRecovery(0);
  const queries = webIqQueries("vessel", vessel);
  assert.deepEqual(queries.map((query) => query.contextType), ["Latest maritime disruption news", "Origin weather — Shanghai", "Destination weather — Rotterdam"]);
  assert.equal(queries[0].endpoint, "news");
  assert.ok(queries.slice(1).every((query) => query.endpoint === "web" && /current/i.test(query.query)));
});

test("each scenario includes a dedicated latest-news Web IQ query", () => {
  for (const scenario of ["pricing", "vessel", "containers"]) {
    assert.ok(webIqQueries(scenario, calculateVesselRecovery(0)).some((query) => query.endpoint === "news" && /latest/i.test(query.query)));
  }
});

test("AI route and move selections are restricted to deterministic options", () => {
  const vessel = calculateVesselRecovery(0);
  assert.equal(resolveScenarioDecision("vessel", vessel, { selectionType: "route", selectionId: vessel.options[1].id, influence: "Cited weather context favors this option." }).selectionId, vessel.options[1].id);
  assert.equal(resolveScenarioDecision("vessel", vessel, { selectionType: "route", selectionId: "invented-route", influence: "Invalid." }).selectionType, "none");
  const containers = calculateContainerMoves({ equipment: "40HC", priority: "balanced" });
  assert.equal(resolveScenarioDecision("containers", containers, { selectionType: "move", selectionId: "1", influence: "Cited context supports the move." }).selectionId, "1");
});

test("portal authentication issues only a signed session for valid credentials", () => {
  const auth = createPortalAuth({
    PORTAL_AUTH_USERNAME: "test-user",
    PORTAL_AUTH_PASSWORD: "test-password",
    PORTAL_AUTH_SESSION_SECRET: "a".repeat(32),
    NODE_ENV: "test"
  });
  const invalidResponse = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  auth.login({ body: { username: "test-user", password: "incorrect" } }, invalidResponse);
  assert.equal(invalidResponse.statusCode, 401);
  const response = { headers: {}, setHeader(name, value) { this.headers[name] = value; }, json(body) { this.body = body; return this; } };
  auth.login({ body: { username: "test-user", password: "test-password" } }, response);
  assert.equal(response.body.authenticated, true);
  assert.ok(response.headers["Set-Cookie"].includes("HttpOnly"));
  assert.equal(auth.isAuthenticated({ headers: { cookie: response.headers["Set-Cookie"] } }), true);
});

import express from "express";
import { createPortalAuth } from "./auth/portal-auth.js";
import { calculateContainerMoves } from "./services/containers.js";
import { applyPricingAdvisory, calculateFreightPrice } from "./services/pricing.js";
import { calculateVesselRecovery } from "./services/vessel.js";
import { getSettings, publicProviderStatus, updateSettings } from "./config/settings.js";
import { containerInputSchema, pricingInputSchema, settingsInputSchema, timeInputSchema } from "./schemas/contracts.js";
import { getWebIqEvidence, testWebIqConnection } from "./providers/webiq.js";
import { createOperatorBrief, createPricingAdvisory, testFoundryConnection } from "./providers/foundry.js";

const scenarioCalculators = {
  pricing: (input) => calculateFreightPrice(pricingInputSchema.parse(input)),
  vessel: (input) => calculateVesselRecovery(timeInputSchema.parse(input).minutes),
  containers: (input) => calculateContainerMoves(containerInputSchema.parse(input))
};

export function createApp() {
  const app = express();
  const auth = createPortalAuth();
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/health", (_request, response) => response.json({ status: "ok", mode: "synthetic-demo", providers: publicProviderStatus() }));
  app.post("/api/auth/login", (request, response) => auth.login(request, response));
  app.post("/api/auth/logout", (request, response) => auth.logout(request, response));
  app.use((request, response, next) => {
    if (request.path === "/login.html" || request.path === "/login.css" || request.path === "/login.js") return next();
    if (auth.isAuthenticated(request)) return next();
    if (request.path.startsWith("/api/")) return response.status(401).json({ error: "Authentication required." });
    return response.redirect(303, "/login.html");
  });
  app.use(express.static("public"));

  app.get("/api/providers", (_request, response) => response.json(publicProviderStatus()));

  app.put("/api/providers", (request, response, next) => {
    try {
      const input = settingsInputSchema.parse(request.body);
      updateSettings({
        webIq: { enabled: input.webIq.enabled, ...(input.webIq.apiKey ? { apiKey: input.webIq.apiKey } : {}) }
      });
      response.json({ ...publicProviderStatus(), retainedCredentials: { webIq: Boolean(getSettings().webIq.apiKey) } });
    } catch (error) { next(error); }
  });

  app.post("/api/providers/:provider/test", async (request, response, next) => {
    try {
      const result = request.params.provider === "webiq" ? await testWebIqConnection()
        : request.params.provider === "foundry" ? await testFoundryConnection() : null;
      if (!result) return response.status(404).json({ error: "Unknown provider." });
      return response.status(result.ok ? 200 : 502).json(result);
    } catch (error) { return next(error); }
  });

  app.get("/api/scenarios/:scenario", async (request, response, next) => {
    try {
      const calculate = scenarioCalculators[request.params.scenario];
      if (!calculate) return response.status(404).json({ error: "Unknown scenario." });
      const baseline = calculate(request.query);
      const context = await getWebIqEvidence(request.params.scenario, baseline);
      const advisory = request.params.scenario === "pricing" ? await createPricingAdvisory({ facts: baseline, evidence: context.evidence }) : null;
      const result = request.params.scenario === "pricing" ? applyPricingAdvisory(baseline, advisory) : baseline;
      let aiReasoning;
      if (request.params.scenario === "pricing") {
        aiReasoning = advisory?.mode === "live"
          ? {
              mode: "live",
              brief: { headline: advisory.headline, rationale: advisory.rationale, reasoningSteps: advisory.reasoningSteps, actions: advisory.actions, caution: advisory.caution },
              citedSources: advisory.citedSources,
              decision: { selectionType: "none", influence: `GPT-5.6-Terra proposed ${advisory.marketBps >= 0 ? "+" : ""}${advisory.marketBps} bps market and ${advisory.disruptionBps >= 0 ? "+" : ""}${advisory.disruptionBps} bps disruption inputs; the server applied ${result.aiAdjustment.basisPoints >= 0 ? "+" : ""}${result.aiAdjustment.basisPoints} bps after bounds validation.` }
            }
          : { mode: "unavailable", brief: { headline: "AI price input unavailable", rationale: advisory?.message || "No live model adjustment was available.", reasoningSteps: [], actions: [], caution: "The deterministic baseline remains available." }, citedSources: [], decision: { selectionType: "none", influence: "No AI price input was applied." } };
      } else {
        try {
          aiReasoning = await createOperatorBrief({ scenario: request.params.scenario, facts: result, evidence: context.evidence });
        } catch (error) {
          aiReasoning = { mode: "unavailable", brief: { headline: "AI decision input unavailable", rationale: error.message, reasoningSteps: [], actions: [], caution: "The deterministic scenario remains available." }, citedSources: [], decision: { selectionType: "none", influence: "No AI decision input was applied." } };
        }
      }
      return response.json({ ...result, externalIntelligence: { label: "External intelligence — evidence for GPT reasoning", ...context }, aiReasoning });
    } catch (error) { return next(error); }
  });

  app.post("/api/scenarios/:scenario/brief", async (request, response, next) => {
    try {
      const calculate = scenarioCalculators[request.params.scenario];
      if (!calculate) return response.status(404).json({ error: "Unknown scenario." });
      const facts = calculate(request.body || {});
      const { evidence } = await getWebIqEvidence(request.params.scenario, facts);
      return response.json(await createOperatorBrief({ scenario: facts.scenario, facts, evidence }));
    } catch (error) { return next(error); }
  });

  app.use((error, _request, response, _next) => {
    const validation = error?.name === "ZodError";
    response.status(validation ? 400 : 502).json({ error: validation ? "Invalid request input." : error.message });
  });
  return app;
}

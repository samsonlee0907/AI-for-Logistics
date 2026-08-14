import { getSettings } from "../config/settings.js";
import { briefSchema } from "../schemas/contracts.js";

function mockBrief(scenario) {
  return {
    mode: "mock",
    brief: {
      headline: `${scenario}: review the deterministic recommendation before operational release.`,
      actions: ["Use the displayed recommendation and guardrails as the decision baseline.", "Review cited context as advisory evidence, not as a calculation input."],
      caution: "Synthetic demo data only. This is not a production pricing, navigation, or dispatch instruction."
    }
  };
}

export async function createOperatorBrief({ scenario, facts, evidence }) {
  const { foundry } = getSettings();
  if (!foundry.enabled) return mockBrief(scenario);
  if (!foundry.endpoint || !foundry.apiKey || !foundry.deployment) throw new Error("Foundry is enabled but endpoint, API key, or deployment is missing.");
  const endpoint = new URL(`openai/deployments/${encodeURIComponent(foundry.deployment)}/chat/completions`, foundry.endpoint.endsWith("/") ? foundry.endpoint : `${foundry.endpoint}/`);
  endpoint.searchParams.set("api-version", "2024-10-21");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "api-key": foundry.apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an operations brief writer. Use only the supplied facts and citations. Do not calculate, invent facts, or give navigation instructions. Return JSON with headline, actions (2-4), caution." },
        { role: "user", content: JSON.stringify({ scenario, deterministicFacts: facts, citedEvidence: evidence }) }
      ]
    }),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`Foundry advisory request failed (${response.status}).`);
  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  let parsed;
  try {
    parsed = briefSchema.parse(JSON.parse(content));
  } catch {
    throw new Error("Foundry returned an invalid structured operator brief.");
  }
  return { mode: "live", brief: parsed };
}

export async function testFoundryConnection() {
  const { foundry } = getSettings();
  if (!foundry.enabled) return { provider: "Foundry", mode: "mock", ok: true, message: "Mock advisory mode is active; no model request was made." };
  try {
    await createOperatorBrief({ scenario: "Connection test", facts: { test: true }, evidence: [] });
    return { provider: "Foundry", mode: "live", ok: true, message: "Live structured advisory response validated." };
  } catch (error) {
    return { provider: "Foundry", mode: "live", ok: false, message: error.message };
  }
}

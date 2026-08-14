import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { AzureOpenAI } from "openai";
import { briefSchema, pricingAdvisorySchema } from "../schemas/contracts.js";

function parseStructuredBrief(content) {
  const text = Array.isArray(content) ? content.map((part) => part.text || "").join("") : content;
  const normalized = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const jsonObject = normalized.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonObject) throw new Error("No JSON object returned.");
  return briefSchema.parse(JSON.parse(jsonObject));
}

function parseStructured(content, schema) {
  const text = Array.isArray(content) ? content.map((part) => part.text || "").join("") : content;
  const normalized = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const jsonObject = normalized.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonObject) throw new Error("No JSON object returned.");
  return schema.parse(JSON.parse(jsonObject));
}

function mockBrief(scenario) {
  return {
    mode: "mock",
    brief: {
      headline: `${scenario}: review the deterministic recommendation before operational release.`,
      rationale: "The embedded model is unavailable in this environment, so no evidence-informed AI decision input was applied.",
      reasoningSteps: ["Read the published deterministic operational baseline.", "No live GPT-5.6-Terra decision input is available in this environment."],
      actions: ["Use the deterministic baseline for this synthetic demonstration.", "Enable the embedded Foundry environment to add bounded AI reasoning."],
      caution: "Synthetic demo data only. This is not a production pricing, navigation, or dispatch instruction."
    },
    citedSources: [],
    decision: { selectionType: "none", influence: "No model decision input was applied." }
  };
}

export function resolveScenarioDecision(scenario, facts, decision) {
  if (scenario === "vessel" && decision.selectionType === "route" && facts.options.some((option) => option.id === decision.selectionId)) return decision;
  if (scenario === "containers" && decision.selectionType === "move" && facts.moves.some((move) => String(move.rank) === decision.selectionId)) return decision;
  return { selectionType: "none", influence: `${decision.influence} The submitted selection was not a valid deterministic option, so it was not applied.` };
}

export async function createOperatorBrief({ scenario, facts, evidence }) {
  const endpoint = process.env.FOUNDRY_ENDPOINT;
  const deployment = process.env.FOUNDRY_DEPLOYMENT;
  if (!endpoint || !deployment) return mockBrief(scenario);
  const credential = new DefaultAzureCredential();
  const azureADTokenProvider = getBearerTokenProvider(credential, "https://cognitiveservices.azure.com/.default");
  const client = new AzureOpenAI({ endpoint, azureADTokenProvider, apiVersion: "2024-10-21" });
  let completion;
  try {
    completion = await client.chat.completions.create({
      model: deployment,
      temperature: 1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are GPT-5.6-Terra, an evidence-informed logistics decision agent. Reason over the supplied deterministic operating facts and indexed external citations. Show how cited news, weather, market, or restriction context influences the decision where relevant. Citations labeled Point-in-time snapshot are dated research artifacts, not live conditions; say that operators must verify them. For vessel, select exactly one listed route id as a bounded recommendation; for containers, select exactly one listed move rank; for pricing, return selectionType none because its bounded market/disruption basis-point signal is already supplied in the facts. You may only select identifiers present in the deterministic facts. You cannot invent operational facts, sources, URLs, routes, capacity, or prices. Return one JSON object only with headline, rationale (under 900 chars), reasoningSteps (2-4), actions (2-4), caution (under 300 chars), sourceIndexes (0-3 supplied citation indexes), and decision { selectionType: none|route|move, selectionId when applicable, influence }. Do not use markdown fences." },
        { role: "user", content: JSON.stringify({ scenario, deterministicFacts: facts, citations: evidence.map((item, index) => ({ index, ...item })) }) }
      ]
    });
  } catch (error) {
    throw new Error(`Embedded Foundry advisory request failed: ${error.message}`);
  }
  const content = completion?.choices?.[0]?.message?.content;
  let parsed;
  try {
    parsed = parseStructuredBrief(content);
  } catch (error) {
    throw new Error(`Foundry returned an invalid structured operator brief: ${error.message}`);
  }
  const citedSources = [...new Set(parsed.sourceIndexes)].map((index) => evidence[index]).filter(Boolean);
  const decision = resolveScenarioDecision(scenario, facts, parsed.decision);
  return {
    mode: "live",
    brief: { headline: parsed.headline, rationale: parsed.rationale, reasoningSteps: parsed.reasoningSteps, actions: parsed.actions, caution: parsed.caution },
    citedSources,
    decision
  };
}

export async function createPricingAdvisory({ facts, evidence }) {
  const endpoint = process.env.FOUNDRY_ENDPOINT;
  const deployment = process.env.FOUNDRY_DEPLOYMENT;
  if (!endpoint || !deployment) return { mode: "unavailable", message: "Embedded Foundry is not configured in this environment." };
  const credential = new DefaultAzureCredential();
  const client = new AzureOpenAI({ endpoint, azureADTokenProvider: getBearerTokenProvider(credential, "https://cognitiveservices.azure.com/.default"), apiVersion: "2024-10-21" });
  try {
    const completion = await client.chat.completions.create({
      model: deployment,
      temperature: 1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are GPT-5.6-Terra, a freight-pricing decision analyst. Review deterministic baseline factors and indexed external citations, then return one JSON object only with headline, marketBps (-150..150 integer), disruptionBps (-150..150 integer), rationale (max 500 chars), reasoningSteps (2-4), actions (2-4), caution (under 300 chars), and sourceIndexes (0-3 supplied citation indexes). Explain how cited market or disruption context influenced the two basis-point inputs when sources are present. Citations labeled Point-in-time snapshot are dated research artifacts, not live market conditions; require operator verification. Never invent facts, sources, or URLs. This is a bounded advisory input, not a free-form quote; the server will clamp and guardrail the result. Do not use markdown fences." },
        { role: "user", content: JSON.stringify({ deterministicBaseline: facts, citations: evidence.map((item, index) => ({ index, ...item })) }) }
      ]
    });
    const parsed = parseStructured(completion?.choices?.[0]?.message?.content, pricingAdvisorySchema);
    return { mode: "live", ...parsed, citedSources: [...new Set(parsed.sourceIndexes)].map((index) => evidence[index]).filter(Boolean) };
  } catch (error) {
    return { mode: "unavailable", message: `Foundry pricing review failed: ${error.message}` };
  }
}

export async function testFoundryConnection() {
  if (!process.env.FOUNDRY_ENDPOINT || !process.env.FOUNDRY_DEPLOYMENT) return { provider: "Foundry", mode: "mock", ok: true, message: "Embedded Foundry environment is not present locally; mock advisory mode is active." };
  try {
    await createOperatorBrief({ scenario: "Connection test", facts: { test: true }, evidence: [] });
    return { provider: "Foundry", mode: "managed-identity", ok: true, message: "Managed identity structured advisory response validated." };
  } catch (error) {
    return { provider: "Foundry", mode: "managed-identity", ok: false, message: error.message };
  }
}

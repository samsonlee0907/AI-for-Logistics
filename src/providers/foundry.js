import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { AzureOpenAI } from "openai";
import { briefSchema } from "../schemas/contracts.js";

function parseStructuredBrief(content) {
  const text = Array.isArray(content) ? content.map((part) => part.text || "").join("") : content;
  const normalized = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const jsonObject = normalized.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonObject) throw new Error("No JSON object returned.");
  return briefSchema.parse(JSON.parse(jsonObject));
}

function mockBrief(scenario) {
  return {
    mode: "mock",
    brief: {
      headline: `${scenario}: review the deterministic recommendation before operational release.`,
      rationale: "The recommendation is based on the displayed deterministic factors and guardrails. No external model changes the underlying calculation.",
      actions: ["Use the displayed recommendation and guardrails as the decision baseline.", "Review cited context as advisory evidence, not as a calculation input."],
      caution: "Synthetic demo data only. This is not a production pricing, navigation, or dispatch instruction."
    },
    citedSources: []
  };
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
        { role: "system", content: "You are an operations recommendation agent. Explain why the deterministic recommendation was made by reasoning over the supplied factors, options, guardrails, and citations. Keep rationale below 900 characters. Do not calculate, invent facts, or give navigation instructions. Return one JSON object only with headline, rationale, actions (2-4), caution, and sourceIndexes (0-3 citation indexes used). Use sourceIndexes only from supplied citations; never invent a source, URL, or operational fact. Do not use markdown fences." },
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
  return {
    mode: "live",
    brief: { headline: parsed.headline, rationale: parsed.rationale, actions: parsed.actions, caution: parsed.caution },
    citedSources
  };
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

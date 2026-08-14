import { getSettings } from "../config/settings.js";
import { mockEvidence } from "../fixtures/data.js";

function normalizeEvidence(payload) {
  const rows = payload?.value || payload?.results || payload?.webPages?.value || payload?.data?.results || [];
  return rows.slice(0, 3).map((row) => ({
    title: row.name || row.title || "Untitled source",
    url: row.url || row.link || "",
    snippet: row.snippet || row.description || row.passage || "",
    timestamp: row.dateLastCrawled || row.timestamp || new Date().toISOString(),
    sourceType: row.sourceType || "external web result"
  }));
}

export async function getWebIqEvidence(topic) {
  const { webIq } = getSettings();
  if (!webIq.enabled) return { mode: "mock", evidence: mockEvidence[topic] };
  if (!webIq.apiKey) throw new Error("Web IQ is enabled but no API key is configured.");
  const url = new URL("v3/search/web", "https://api.microsoft.ai/");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-apikey": webIq.apiKey,
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      query: `${topic} shipping logistics operational context`,
      maxResults: 3,
      language: "en",
      region: "US",
      contentFormat: "html",
      maxLength: 10_000,
      safeSearch: "strict"
    }),
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`Web IQ request failed (${response.status}).`);
  const evidence = normalizeEvidence(await response.json());
  if (!evidence.length) throw new Error("Web IQ returned no usable citation-ready evidence.");
  return { mode: "live", evidence };
}

export async function testWebIqConnection() {
  const { webIq } = getSettings();
  if (!webIq.enabled) return { provider: "Web IQ", mode: "mock", ok: true, message: "Mock mode is active; no external request was made." };
  if (!webIq.apiKey) return { provider: "Web IQ", mode: "live", ok: false, message: "Web IQ is enabled but no API key is configured." };
  try {
    await getWebIqEvidence("port congestion");
    return { provider: "Web IQ", mode: "live", ok: true, message: "Live Web IQ returned citation-ready evidence." };
  } catch (error) {
    return { provider: "Web IQ", mode: "live", ok: false, message: error.message };
  }
}

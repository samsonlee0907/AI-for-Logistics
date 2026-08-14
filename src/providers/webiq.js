import { getSettings } from "../config/settings.js";

function normalizeEvidence(payload) {
  const rows = [];
  const seenUrls = new Set();
  const visit = (value, depth = 0) => {
    if (!value || depth > 5) return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }
    if (typeof value !== "object") return;
    const url = value.url || value.link || value.uri || value.webUrl || value.web_url;
    if (typeof url === "string" && !seenUrls.has(url)) {
      seenUrls.add(url);
      rows.push(value);
    }
    Object.values(value).forEach((item) => visit(item, depth + 1));
  };
  visit(payload);
  const text = (value) => {
    const raw = typeof value === "string" ? value : value?.text || value?.content || "";
    return raw.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim().slice(0, 460);
  };
  return rows.slice(0, 3).map((row) => ({
    title: row.name || row.title || row.source?.title || "Untitled source",
    url: row.url || row.link || row.uri || row.webUrl || row.web_url,
    snippet: text(row.snippet) || text(row.description) || text(row.passage) || text(row.content) || text(row.summary),
    timestamp: row.dateLastCrawled || row.timestamp || row.publishedAt || new Date().toISOString(),
    sourceType: row.sourceType || row.type || "external web result"
  }));
}

export async function getWebIqEvidence(topic) {
  const { webIq } = getSettings();
  if (!webIq.enabled) return { mode: "disabled", evidence: [] };
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
  if (!webIq.enabled) return { provider: "Web IQ", mode: "disabled", ok: true, message: "External intelligence is disabled; no Web IQ request was made." };
  if (!webIq.apiKey) return { provider: "Web IQ", mode: "live", ok: false, message: "Web IQ is enabled but no API key is configured." };
  try {
    await getWebIqEvidence("port congestion");
    return { provider: "Web IQ", mode: "live", ok: true, message: "Live Web IQ returned citation-ready evidence." };
  } catch (error) {
    return { provider: "Web IQ", mode: "live", ok: false, message: error.message };
  }
}

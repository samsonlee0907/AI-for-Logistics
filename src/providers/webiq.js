import { getSettings } from "../config/settings.js";

function normalizeEvidence(payload, contextType) {
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
    sourceType: contextType || row.sourceType || row.type || "external web result"
  }));
}

export function webIqQueries(topic, facts = {}) {
  if (topic === "vessel") {
    const origin = facts?.map?.ports?.CNSHA?.name || "Shanghai";
    const destination = facts?.map?.ports?.NLRTM?.name || "Rotterdam";
    return [
      { endpoint: "news", contextType: "Latest maritime disruption news", query: "latest shipping disruption news Singapore Strait port congestion vessel routing" },
      { endpoint: "web", contextType: `Origin weather — ${origin}`, query: `current marine weather and port operating conditions near ${origin} China shipping` },
      { endpoint: "web", contextType: `Destination weather — ${destination}`, query: `current marine weather and port operating conditions near ${destination} Netherlands shipping` }
    ];
  }
  if (topic === "pricing") {
    return [
      { endpoint: "news", contextType: "Latest freight market news", query: "latest ocean freight market news Shanghai Rotterdam container shipping" },
      { endpoint: "web", contextType: "Market and disruption context", query: "current Shanghai Rotterdam ocean freight market disruption port congestion" }
    ];
  }
  if (topic === "containers") {
    return [
      { endpoint: "news", contextType: "Latest equipment market news", query: "latest empty container availability news port equipment shortage shipping" },
      { endpoint: "web", contextType: "Demand and restriction context", query: "current port container equipment restrictions demand imbalance shipping" }
    ];
  }
  return [{ endpoint: "web", contextType: "Operational context", query: `${topic} shipping logistics operational context` }];
}

async function searchWeb(query, apiKey) {
  const isNews = query.endpoint === "news";
  const url = new URL(isNews ? "v3/search/news" : "v3/search/web", "https://api.microsoft.ai/");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-apikey": apiKey,
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      query: query.query,
      maxResults: isNews ? 3 : 2,
      language: "en",
      region: "US",
      maxLength: isNews ? 3_000 : 10_000,
      ...(!isNews ? { contentFormat: "html", safeSearch: "strict" } : {})
    }),
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`Web IQ ${query.contextType.toLowerCase()} request failed (${response.status}).`);
  const evidence = normalizeEvidence(await response.json(), query.contextType);
  if (!evidence.length) throw new Error(`Web IQ returned no citation-ready evidence for ${query.contextType.toLowerCase()}.`);
  return evidence;
}

export async function getWebIqEvidence(topic, facts) {
  const { webIq } = getSettings();
  if (!webIq.enabled) return { mode: "disabled", evidence: [] };
  if (!webIq.apiKey) throw new Error("Web IQ is enabled but no API key is configured.");
  const evidence = (await Promise.all(webIqQueries(topic, facts).map((query) => searchWeb(query, webIq.apiKey)))).flat();
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

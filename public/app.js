const state = { vesselMinutes: 0, currentScenario: "pricing", pricing: null, vessel: null, containers: null, recommendationRequests: {} };
const $ = (selector) => document.querySelector(selector);
const money = (value) => `$${Number(value).toLocaleString()}`;
const h = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path, options) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || "Request failed.");
  return data;
}

async function withBusy(button, label, work) {
  const original = button.textContent;
  button.disabled = true;
  button.classList.add("is-loading");
  button.textContent = label;
  try { return await work(); } finally {
    button.disabled = false;
    button.classList.remove("is-loading");
    button.textContent = original;
  }
}

function evidence(target, modeTarget, data) {
  const { mode, evidence: sources } = data.externalIntelligence;
  $(modeTarget).textContent = mode === "live" ? "LIVE CITATIONS" : mode === "snapshot" ? "DATED SNAPSHOT" : "OFF";
  if (!sources.length) {
    $(target).innerHTML = `<div class="evidence-empty"><strong>Web IQ evidence is off</strong><p>GPT-5.6-Terra can still reason over synthetic operating facts. Enable Web IQ to supply current cited news and conditions as additional decision evidence.</p></div>`;
    return;
  }
  $(target).innerHTML = sources.map((item) => {
    let domain = "source";
    try { domain = new URL(item.url).hostname.replace(/^www\./, ""); } catch { /* URL was validated server-side, retain safe label if it is malformed. */ }
    const excerpt = h(item.snippet);
    const timestamp = new Date(item.timestamp);
    const isSnapshot = mode === "snapshot";
    const ageMinutes = Math.max(0, Math.round((Date.now() - timestamp.getTime()) / 60_000));
    const freshness = isSnapshot ? `captured ${timestamp.toLocaleDateString()}` : Number.isFinite(ageMinutes) ? (ageMinutes < 60 ? `${ageMinutes}m observed` : ageMinutes < 1_440 ? `${Math.round(ageMinutes / 60)}h observed` : `${Math.round(ageMinutes / 1_440)}d observed`) : "timestamp unavailable";
    return `<article class="evidence"><div class="evidence-meta"><span>${h(domain)}</span><span>${h(item.sourceType)}</span><span>${h(freshness)}</span></div><a href="${h(item.url)}" target="_blank" rel="noreferrer">${h(item.title)}</a><p>${excerpt.slice(0, 210)}${excerpt.length > 210 ? "…" : ""}</p>${excerpt.length > 210 ? `<details><summary>Read cited context</summary><p>${excerpt}</p></details>` : ""}<span class="evidence-link">Open source ↗</span></article>`;
  }).join("");
}

async function loadPricing() {
  const query = new URLSearchParams({ demandIndex: $("#demand").value, capacityIndex: $("#capacity").value, equipment: $("#equipment").value, serviceTier: $("#serviceTier").value, disruption: $("#pricingDisruption").value });
  const data = await api(`/api/scenarios/pricing?${query}`);
  state.pricing = data;
  $("#priceValue").textContent = data.recommendation.toLocaleString();
  $("#priceCurrency").textContent = data.currency;
  $("#priceConfidence").textContent = `${data.confidence}%`;
  $("#confidenceMeter").style.width = `${data.confidence}%`;
  $("#priceFloor").textContent = money(data.guardrails.floor);
  $("#priceCeiling").textContent = money(data.guardrails.ceiling);
  $("#priceApproval").textContent = data.guardrails.approval;
  $("#priceDecision").textContent = data.audit.decision;
  $("#priceAudit").innerHTML = Object.entries(data.audit).filter(([key]) => key !== "assumptions").map(([key, value]) => `<div><dt>${h(key.replace(/([A-Z])/g, " $1"))}</dt><dd>${h(value)}</dd></div>`).join("");
  const baseline = data.baselineRecommendation || data.recommendation;
  const adjustment = data.aiAdjustment || { amount: 0, basisPoints: 0, mode: "unavailable" };
  $("#pricingKpis").innerHTML = [["Deterministic baseline", money(baseline)], ["GPT market signal", `${adjustment.basisPoints >= 0 ? "+" : ""}${adjustment.basisPoints} bps`], ["Evidence-informed change", `${adjustment.amount >= 0 ? "+" : ""}${money(adjustment.amount)}`], ["Guardrail headroom", money(data.guardrails.ceiling - data.recommendation)]].map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`).join("");
  $("#factorList").innerHTML = data.factors.map((factor) => `<article class="factor"><div><strong>${h(factor.label)}</strong><small>${h(factor.rationale)}</small></div><b class="${factor.value >= 0 ? "up" : "down"}">${factor.value >= 0 ? "+" : ""}${money(factor.value)}</b></article>`).join("");
  evidence("#pricingEvidence", "#pricingEvidenceMode", data);
  renderAgentRecommendation("#pricingAi", data.aiReasoning);
}

function mapSvg(data) {
  const { ports, planned } = data.map;
  const project = ({ latitude, longitude }) => ({ x: longitude + 10, y: 60 - latitude });
  const point = (coordinates) => {
    const { x, y } = project(coordinates);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const coastline = (coordinates) => `<path class="coastline" d="M ${coordinates.map(([longitude, latitude]) => point({ latitude, longitude })).join(" L ")}"/>`;
  const lines = (route, className) => `<polyline class="${className}" points="${route.map((code) => point(ports[code])).join(" ")}"/>`;
  const recommended = data.options.find((option) => option.id === state.selectedRouteId)?.route || data.options.find((option) => option.recommended).route;
  const vessel = project({ latitude: data.vessel.position[0], longitude: data.vessel.position[1] });
  const grids = [0, 20, 40, 60, 80, 100, 120].map((longitude) => `<line class="map-grid" x1="${longitude + 10}" y1="0" x2="${longitude + 10}" y2="70"/>`).join("") + [0, 20, 40, 60].map((latitude) => `<line class="map-grid" x1="0" y1="${60 - latitude}" x2="140" y2="${60 - latitude}"/>`).join("");
  const land = [
    [[-8,35],[-3,36],[2,43],[9,44],[16,42],[24,38],[29,36],[33,31],[35,28],[39,23],[43,16],[48,12],[52,16],[55,25],[60,25],[67,23],[73,20],[77,15],[80,8],[86,7],[91,11],[98,8],[103,2],[104,12],[110,20],[114,23],[118,30],[121,31],[122,37],[126,42]],
    [[34,31],[30,30],[28,25],[31,22],[35,20],[38,16],[42,13],[48,12],[52,16],[55,25]],
    [[33,30],[30,24],[31,18],[34,12],[38,7],[42,2],[42,-8],[31,-10],[22,-5],[15,2],[7,5],[-1,9],[-8,16]],
    [[-9,35],[-6,36],[-5,43],[-1,47],[4,48],[10,45],[16,43]]
  ].map(coastline).join("");
  const changed = recommended.join("|") !== planned.join("|");
  return `<svg viewBox="0 0 140 70" preserveAspectRatio="xMidYMid meet" aria-label="Geographic Asia to Europe shipping corridor schematic"><defs><linearGradient id="route" x1="0" x2="1"><stop stop-color="#50d7bd"/><stop offset="1" stop-color="#a5ee64"/></linearGradient></defs>${grids}${land}${lines(planned, "map-line planned")}${lines(recommended, "map-line recommended")}${Object.entries(ports).map(([code, port]) => { const { x, y } = project(port); return `<g><circle class="port-dot" cx="${x}" cy="${y}" r="1.25"/><text x="${x}" y="${y - 2.4}">${code}</text></g>`; }).join("")}<circle class="vessel-dot" cx="${vessel.x}" cy="${vessel.y}" r="1.35"/></svg><div class="route-shift ${changed ? "changed" : ""}">${changed ? `Recovery route diverts via ${recommended[1]}` : "Route remains on plan"}</div><div class="map-key"><span><i class="planned-key"></i> Planned</span><span><i class="recommended-key"></i> Recommended</span><span><i class="vessel-key"></i> MV Horizon Relay</span><span class="map-note">Geographic schematic · not for navigation</span></div>`;
}

async function loadVessel() {
  const data = await api(`/api/scenarios/vessel?minutes=${state.vesselMinutes}`);
  state.vessel = data;
  $("#simClock").textContent = `${Math.floor(state.vesselMinutes / 60)}h ${String(state.vesselMinutes % 60).padStart(2, "0")}m`;
  $("#disruptionBadge").textContent = data.disruption.severity.toUpperCase();
  $("#disruptionBadge").className = `badge risk-${data.disruption.severity}`;
  $("#vesselDisruption").textContent = data.disruption.description;
  $("#vesselMetrics").innerHTML = [["Port congestion", `${Math.round(data.signals.congestion * 100)}%`], ["Berth wait", `${data.signals.berthWait}h`], ["Weather penalty", `${Math.round(data.signals.weatherPenalty * 100)}%`], ["Vessel speed", `${data.vessel.speed} kn`]].map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`).join("");
  const aiRoute = data.aiReasoning?.decision?.selectionType === "route" ? data.aiReasoning.decision.selectionId : null;
  const selected = data.options.find((option) => option.id === state.selectedRouteId) || data.options.find((option) => option.id === aiRoute) || data.options.find((option) => option.recommended);
  $("#routeMap").innerHTML = mapSvg(data);
  $("#routeOptions").innerHTML = data.options.map((option) => `<article class="route-option ${option.id === selected.id ? "selected" : ""}"><div><p>${option.id === selected.id ? (option.id === aiRoute && !state.selectedRouteId ? "GPT-RECOMMENDED" : "SELECTED") : option.id.toUpperCase()}</p><strong>${option.route.join(" → ")}</strong></div><span class="badge risk-${option.risk}">${option.risk}</span><div class="route-stats"><span>${option.transitHours}h transit</span><span>${money(option.cost)}</span><span>${option.carbon}t CO₂e</span><span>+${option.delay}h delay</span></div></article>`).join("");
  $("#routeTimeline").innerHTML = [["Plan", data.map.planned.join(" → ")], ["Trigger", data.disruption.description], ["Selected recovery", selected.route.join(" → ")], ["Impact", `${selected.delay}h delay · ${money(selected.cost)} · ${selected.carbon}t CO₂e`]].map(([label, value], index) => `<div class="timeline-step"><b>${index + 1}</b><div><span>${label}</span><strong>${h(value)}</strong></div></div>`).join("");
  $("#vesselDetails").innerHTML = [["Vessel", data.vessel.name], ["MMSI", data.vessel.mmsi], ["Position", `${data.vessel.position[0]}, ${data.vessel.position[1]}`], ["Next port", data.vessel.nextPort], ["Calculation", data.audit.deterministicMethod]].map(([key, value]) => `<div><dt>${h(key)}</dt><dd>${h(value)}</dd></div>`).join("");
  evidence("#vesselEvidence", "#vesselEvidenceMode", data);
  renderAgentRecommendation("#vesselAi", data.aiReasoning);
}

async function loadContainers() {
  const query = new URLSearchParams({ equipment: $("#containerEquipment").value, priority: $("#containerPriority").value });
  const data = await api(`/api/scenarios/containers?${query}`);
  state.containers = data;
  $("#equipmentLabel").textContent = data.equipment;
  $("#containerMetrics").innerHTML = [["Moves proposed", data.moves.length], ["Units repositioned", data.impact.moved], ["Synthetic cost", money(data.impact.cost)], ["Carbon proxy", `${data.impact.carbon}t`]].map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`).join("");
  $("#portBalances").innerHTML = data.ports.map((port) => `<article class="balance"><div><strong>${port.code}</strong><span>${h(port.name)}</span></div><div class="balance-bar"><i class="${port.balance >= 0 ? "surplus" : "deficit"}" style="width:${Math.min(Math.abs(port.balance) / 3.2, 100)}%"></i></div><b class="${port.balance >= 0 ? "up" : "down"}">${port.balance >= 0 ? "+" : ""}${port.balance}</b></article>`).join("");
  const aiMove = data.aiReasoning?.decision?.selectionType === "move" ? data.aiReasoning.decision.selectionId : null;
  $("#containerMoves").innerHTML = data.moves.map((move) => `<article class="move ${String(move.rank) === aiMove ? "ai-priority" : ""}"><b>#${move.rank}</b><div><strong>${move.origin} → ${move.destination}</strong><span>${String(move.rank) === aiMove ? "GPT priority · " : ""}${move.units} ${data.equipment} · ${move.distance.toLocaleString()} nm</span></div><div><strong>${money(move.cost)}</strong><span>${move.carbon}t CO₂e · +${move.service} service</span></div></article>`).join("");
  $("#containerFlow").innerHTML = data.moves.slice(0, 3).map((move, index) => `<div class="flow-row"><span class="flow-port">${move.origin}<i class="flow-surplus"></i></span><div class="flow-track"><i style="animation-delay:${index * .25}s"></i><b>${move.units} ${data.equipment}</b></div><span class="flow-port">${move.destination}<i class="flow-deficit"></i></span></div>`).join("");
  $("#constraints").innerHTML = data.moves.map((move) => `<p class="constraint"><strong>${move.origin} → ${move.destination}:</strong> ${h(move.constraint)}</p>`).join("");
  evidence("#containersEvidence", "#containersEvidenceMode", data);
  renderAgentRecommendation("#containersAi", data.aiReasoning);
}

function renderAgentRecommendation(target, data) {
  if (!data || data.mode === "unavailable") {
    $(target).innerHTML = `<div class="agent-error"><strong>AI decision input unavailable</strong><p>${h(data?.brief?.rationale || "The deterministic decision remains available.")}</p></div>`;
    return;
  }
  const sources = data.citedSources?.length ? `<div class="agent-sources"><span>Sources applied</span>${data.citedSources.map((source) => `<a href="${h(source.url)}" target="_blank" rel="noreferrer">${h(source.title)} ↗</a>`).join("")}</div>` : `<p class="tiny">No Web IQ sources were available; GPT reasoned over synthetic operating facts only.</p>`;
  const steps = data.brief.reasoningSteps?.length ? `<ol class="reasoning-steps">${data.brief.reasoningSteps.map((step) => `<li>${h(step)}</li>`).join("")}</ol>` : "";
  const influence = data.decision?.influence ? `<div class="decision-influence"><span>Applied decision input</span><strong>${h(data.decision.influence)}</strong></div>` : "";
  const handoffLabel = target === "#pricingAi" ? "Acknowledge quote review" : target === "#vesselAi" ? "Acknowledge route review" : "Acknowledge move review";
  $(target).innerHTML = `<div class="panel-head"><div><p class="eyebrow">Evidence-informed GPT reasoning</p><h3>${h(data.brief.headline)}</h3></div><span class="badge">${data.mode === "live" ? "GPT-5.6-TERRA" : "LOCAL FALLBACK"}</span></div><p class="agent-rationale">${h(data.brief.rationale)}</p>${influence}${steps}<div class="agent-actions">${data.brief.actions.map((action) => `<span>${h(action)}</span>`).join("")}</div><div class="operator-handoff"><span>Operator handoff</span><strong>Validate authority, source freshness, and current operating status before execution.</strong><button class="button ghost decision-acknowledge" type="button">${handoffLabel}</button></div><p class="callout">${h(data.brief.caution)}</p>${sources}`;
}

async function loadScenario(name) {
  try {
    if (name === "pricing") await loadPricing();
    if (name === "vessel") await loadVessel();
    if (name === "containers") await loadContainers();
  } catch (error) { alert(`Unable to load scenario: ${error.message}`); }
}

async function providerStatus() {
  const status = await api("/api/providers");
  $("#webIqEnabled").checked = status.webIq.enabled;
}

async function saveProviders() {
  const body = { webIq: { enabled: $("#webIqEnabled").checked, apiKey: $("#webIqKey").value || undefined } };
  await api("/api/providers", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  $("#webIqKey").value = "";
  $("#configDialog").close();
  await loadScenario(state.currentScenario);
}

async function testProvider(provider) {
  const target = provider === "webiq" ? "#webIqResult" : "#foundryResult";
  $(target).textContent = "Testing…";
  try {
    if (provider === "webiq") {
      await api("/api/providers", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ webIq: { enabled: $("#webIqEnabled").checked, apiKey: $("#webIqKey").value || undefined } })
      });
      $("#webIqKey").value = "";
    }
    const result = await api(`/api/providers/${provider}/test`, { method: "POST" });
    $(target).textContent = `${result.mode}: ${result.message}`;
  }
  catch (error) { $(target).textContent = `Failed: ${error.message}`; }
}

async function brief(scenario) {
  try {
    const data = await api(`/api/scenarios/${scenario}/brief`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(scenario === "vessel" ? { minutes: state.vesselMinutes } : scenario === "pricing" ? { demandIndex: $("#demand").value, capacityIndex: $("#capacity").value, equipment: $("#equipment").value, serviceTier: $("#serviceTier").value, disruption: $("#pricingDisruption").value } : { equipment: $("#containerEquipment").value, priority: $("#containerPriority").value }) });
    $("#briefTitle").textContent = `${scenario} / ${data.mode} advisory`;
    const sources = data.citedSources?.length ? `<section class="brief-sources"><p class="eyebrow">Sources used by this brief</p>${data.citedSources.map((source) => `<a href="${h(source.url)}" target="_blank" rel="noreferrer">${h(source.title)} ↗</a>`).join("")}</section>` : `<p class="tiny">No live external citations were used for this brief.</p>`;
    $("#briefContent").innerHTML = `<h3>${h(data.brief.headline)}</h3><ul>${data.brief.actions.map((action) => `<li>${h(action)}</li>`).join("")}</ul><p class="callout">${h(data.brief.caution)}</p>${sources}`;
    $("#briefDialog").showModal();
  } catch (error) { alert(`Brief unavailable: ${error.message}`); }
}

$("#scenarioNav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-scenario]"); if (!button) return;
  state.currentScenario = button.dataset.scenario;
  document.querySelectorAll(".nav-item, .scenario").forEach((item) => item.classList.remove("active"));
  button.classList.add("active"); $(`#${state.currentScenario}`).classList.add("active");
  $("#pageTitle").textContent = { pricing: "Dynamic Freight Pricing Control Tower", vessel: "Vessel Network Disruption Recovery", containers: "Empty Container Utilization Across Ports" }[state.currentScenario];
  loadScenario(state.currentScenario);
});
["#demand", "#capacity"].forEach((selector) => $(selector).addEventListener("input", (event) => { $(`${selector}Out`).textContent = event.target.value; }));
$("#priceRefresh").addEventListener("click", (event) => withBusy(event.currentTarget, "Calculating…", loadPricing));
$("#containerRefresh").addEventListener("click", (event) => withBusy(event.currentTarget, "Ranking moves…", loadContainers));
document.querySelectorAll(".vessel-step").forEach((button) => button.addEventListener("click", () => withBusy(button, "Updating route…", async () => { state.vesselMinutes += Number(button.dataset.step); await loadVessel(); })));
$("#resetVessel").addEventListener("click", (event) => withBusy(event.currentTarget, "Resetting…", async () => { state.vesselMinutes = 0; await loadVessel(); }));
$("#routeOptions").addEventListener("click", (event) => {
  const card = event.target.closest(".route-option");
  if (!card || !state.vessel) return;
  const route = [...document.querySelectorAll(".route-option")].indexOf(card);
  state.selectedRouteId = state.vessel.options[route].id;
  loadVessel();
});
$("#openConfig").addEventListener("click", async () => { await providerStatus(); $("#configDialog").showModal(); });
$("#logout").addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.assign("/login.html");
});
document.addEventListener("click", (event) => {
  const button = event.target.closest(".decision-acknowledge");
  if (!button) return;
  button.textContent = "Review acknowledged";
  button.disabled = true;
  button.closest(".operator-handoff").classList.add("acknowledged");
});
$("#saveConfig").addEventListener("click", () => saveProviders().catch((error) => alert(`Unable to save: ${error.message}`)));
$("#testWebIq").addEventListener("click", () => testProvider("webiq"));
loadPricing();

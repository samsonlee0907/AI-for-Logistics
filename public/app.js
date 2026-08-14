const state = { vesselMinutes: 0, currentScenario: "pricing", pricing: null, vessel: null, containers: null };
const $ = (selector) => document.querySelector(selector);
const money = (value) => `$${Number(value).toLocaleString()}`;
const h = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path, options) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || "Request failed.");
  return data;
}

function evidence(target, modeTarget, data) {
  $(modeTarget).textContent = data.externalIntelligence.mode === "live" ? "LIVE CITATIONS" : "SIMULATED";
  $(target).innerHTML = data.externalIntelligence.evidence.map((item) => `<article class="evidence"><p class="tiny">${h(item.sourceType)} · ${new Date(item.timestamp).toLocaleString()}</p><a href="${h(item.url)}" target="_blank" rel="noreferrer">${h(item.title)}</a><p>${h(item.snippet)}</p></article>`).join("");
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
  $("#factorList").innerHTML = data.factors.map((factor) => `<article class="factor"><div><strong>${h(factor.label)}</strong><small>${h(factor.rationale)}</small></div><b class="${factor.value >= 0 ? "up" : "down"}">${factor.value >= 0 ? "+" : ""}${money(factor.value)}</b></article>`).join("");
  evidence("#pricingEvidence", "#pricingEvidenceMode", data);
}

function mapSvg(data) {
  const { ports, planned } = data.map;
  const lines = (route, className) => route.slice(1).map((to, i) => `<line class="${className}" x1="${ports[route[i]].x}%" y1="${ports[route[i]].y}%" x2="${ports[to].x}%" y2="${ports[to].y}%"/>`).join("");
  const recommended = data.options.find((option) => option.recommended).route;
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="route" x1="0" x2="1"><stop stop-color="#50d7bd"/><stop offset="1" stop-color="#a5ee64"/></linearGradient></defs>${lines(planned, "map-line planned")}${lines(recommended, "map-line recommended")}${Object.entries(ports).map(([code, port]) => `<g><circle class="port-dot" cx="${port.x}" cy="${port.y}" r="1.7"/><text x="${port.x}" y="${port.y - 3}">${code}</text></g>`).join("")}<circle class="vessel-dot" cx="${ports.CNSHA.x + 5}" cy="${ports.CNSHA.y + 8}" r="1.8"/></svg><div class="map-key"><span><i class="planned-key"></i> Planned</span><span><i class="recommended-key"></i> Recommended</span><span><i class="vessel-key"></i> MV Horizon Relay</span></div>`;
}

async function loadVessel() {
  const data = await api(`/api/scenarios/vessel?minutes=${state.vesselMinutes}`);
  state.vessel = data;
  $("#simClock").textContent = `${Math.floor(state.vesselMinutes / 60)}h ${String(state.vesselMinutes % 60).padStart(2, "0")}m`;
  $("#disruptionBadge").textContent = data.disruption.severity.toUpperCase();
  $("#disruptionBadge").className = `badge risk-${data.disruption.severity}`;
  $("#vesselDisruption").textContent = data.disruption.description;
  $("#vesselMetrics").innerHTML = [["Port congestion", `${Math.round(data.signals.congestion * 100)}%`], ["Berth wait", `${data.signals.berthWait}h`], ["Weather penalty", `${Math.round(data.signals.weatherPenalty * 100)}%`], ["Vessel speed", `${data.vessel.speed} kn`]].map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`).join("");
  $("#routeMap").innerHTML = mapSvg(data);
  $("#routeOptions").innerHTML = data.options.map((option) => `<article class="route-option ${option.recommended ? "selected" : ""}"><div><p>${option.recommended ? "RECOMMENDED" : option.id.toUpperCase()}</p><strong>${option.route.join(" → ")}</strong></div><span class="badge risk-${option.risk}">${option.risk}</span><div class="route-stats"><span>${option.transitHours}h transit</span><span>${money(option.cost)}</span><span>${option.carbon}t CO₂e</span><span>+${option.delay}h delay</span></div></article>`).join("");
  $("#vesselDetails").innerHTML = [["Vessel", data.vessel.name], ["MMSI", data.vessel.mmsi], ["Position", `${data.vessel.position[0]}, ${data.vessel.position[1]}`], ["Next port", data.vessel.nextPort], ["Calculation", data.audit.deterministicMethod]].map(([key, value]) => `<div><dt>${h(key)}</dt><dd>${h(value)}</dd></div>`).join("");
  evidence("#vesselEvidence", "#vesselEvidenceMode", data);
}

async function loadContainers() {
  const query = new URLSearchParams({ equipment: $("#containerEquipment").value, priority: $("#containerPriority").value });
  const data = await api(`/api/scenarios/containers?${query}`);
  state.containers = data;
  $("#equipmentLabel").textContent = data.equipment;
  $("#containerMetrics").innerHTML = [["Moves proposed", data.moves.length], ["Units repositioned", data.impact.moved], ["Synthetic cost", money(data.impact.cost)], ["Carbon proxy", `${data.impact.carbon}t`]].map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`).join("");
  $("#portBalances").innerHTML = data.ports.map((port) => `<article class="balance"><div><strong>${port.code}</strong><span>${h(port.name)}</span></div><div class="balance-bar"><i class="${port.balance >= 0 ? "surplus" : "deficit"}" style="width:${Math.min(Math.abs(port.balance) / 3.2, 100)}%"></i></div><b class="${port.balance >= 0 ? "up" : "down"}">${port.balance >= 0 ? "+" : ""}${port.balance}</b></article>`).join("");
  $("#containerMoves").innerHTML = data.moves.map((move) => `<article class="move"><b>#${move.rank}</b><div><strong>${move.origin} → ${move.destination}</strong><span>${move.units} ${data.equipment} · ${move.distance.toLocaleString()} nm</span></div><div><strong>${money(move.cost)}</strong><span>${move.carbon}t CO₂e · +${move.service} service</span></div></article>`).join("");
  $("#constraints").innerHTML = data.moves.map((move) => `<p class="constraint"><strong>${move.origin} → ${move.destination}:</strong> ${h(move.constraint)}</p>`).join("");
  evidence("#containersEvidence", "#containersEvidenceMode", data);
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
  $("#foundryEnabled").checked = status.foundry.enabled;
}

async function saveProviders() {
  const body = { webIq: { enabled: $("#webIqEnabled").checked, baseUrl: $("#webIqBaseUrl").value || undefined, apiKey: $("#webIqKey").value || undefined }, foundry: { enabled: $("#foundryEnabled").checked, endpoint: $("#foundryEndpoint").value || undefined, apiKey: $("#foundryKey").value || undefined, deployment: $("#foundryDeployment").value || undefined } };
  await api("/api/providers", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  $("#webIqKey").value = ""; $("#foundryKey").value = "";
  $("#configDialog").close();
  await loadScenario(state.currentScenario);
}

async function testProvider(provider) {
  const target = provider === "webiq" ? "#webIqResult" : "#foundryResult";
  $(target).textContent = "Testing…";
  try { const result = await api(`/api/providers/${provider}/test`, { method: "POST" }); $(target).textContent = `${result.mode}: ${result.message}`; }
  catch (error) { $(target).textContent = `Failed: ${error.message}`; }
}

async function brief(scenario) {
  try {
    const data = await api(`/api/scenarios/${scenario}/brief`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(scenario === "vessel" ? { minutes: state.vesselMinutes } : scenario === "pricing" ? { demandIndex: $("#demand").value, capacityIndex: $("#capacity").value, equipment: $("#equipment").value, serviceTier: $("#serviceTier").value, disruption: $("#pricingDisruption").value } : { equipment: $("#containerEquipment").value, priority: $("#containerPriority").value }) });
    $("#briefTitle").textContent = `${scenario} / ${data.mode} advisory`;
    $("#briefContent").innerHTML = `<h3>${h(data.brief.headline)}</h3><ul>${data.brief.actions.map((action) => `<li>${h(action)}</li>`).join("")}</ul><p class="callout">${h(data.brief.caution)}</p>`;
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
$("#priceRefresh").addEventListener("click", loadPricing);
$("#containerRefresh").addEventListener("click", loadContainers);
document.querySelectorAll(".vessel-step").forEach((button) => button.addEventListener("click", () => { state.vesselMinutes += Number(button.dataset.step); loadVessel(); }));
$("#resetVessel").addEventListener("click", () => { state.vesselMinutes = 0; loadVessel(); });
$("#openConfig").addEventListener("click", async () => { await providerStatus(); $("#configDialog").showModal(); });
$("#saveConfig").addEventListener("click", () => saveProviders().catch((error) => alert(`Unable to save: ${error.message}`)));
$("#testWebIq").addEventListener("click", () => testProvider("webiq"));
$("#testFoundry").addEventListener("click", () => testProvider("foundry"));
document.querySelectorAll(".brief-button").forEach((button) => button.addEventListener("click", () => brief(button.dataset.scenario)));
loadPricing();

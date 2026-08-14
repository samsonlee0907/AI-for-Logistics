import { ports, routeLinks } from "../fixtures/data.js";

const fuelTonsPerNm = 0.045;
const carbonPerFuelTon = 3.114;

const severityFor = (score) => score >= 0.72 ? "severe" : score >= 0.48 ? "high" : score >= 0.24 ? "medium" : "low";

export function calculateVesselRecovery(minutes = 0) {
  const hours = minutes / 60;
  const storm = Math.min(Math.max((hours - 4) / 18, 0), 1);
  const congestion = Math.min(0.3 + hours * 0.022 + Math.sin(hours / 2.2) * 0.035, 0.95);
  const berthWait = Math.max(3 + hours * 0.95 + Math.sin(hours / 2.5) * 1.8, 1);
  const closure = hours >= 20;
  const weatherPenalty = Math.min(0.06 + storm * 0.24 + Math.cos(hours / 1.8) * 0.012, 0.38);
  const portPenalty = (code) => code === "SGSIN" ? berthWait + (closure ? 48 : 0) : ({ MYPKG: 6.8, AEMZA: 4.8, ESALG: 5.6, NLRTM: 7.6 }[code] || 0);
  const options = [
    ["CNSHA", "MYPKG", "AEMZA", "NLRTM"],
    ["CNSHA", "SGSIN", "AEMZA", "NLRTM"],
    ["CNSHA", "MYPKG", "AEMZA", "ESALG", "NLRTM"]
  ].map((path, index) => {
    let miles = 0;
    let transit = 0;
    for (let i = 0; i < path.length - 1; i += 1) {
      const link = routeLinks.find(([from, to]) => from === path[i] && to === path[i + 1]);
      miles += link[2];
      const weather = path[i] === "CNSHA" && path[i + 1] === "SGSIN" ? weatherPenalty : path[i] === "CNSHA" ? 0.06 : 0.03;
      transit += link[3] * (1 + weather) + portPenalty(path[i + 1]);
    }
    const fuel = miles * fuelTonsPerNm;
    const delay = Math.max(transit - 732, 0);
    const risk = path.includes("SGSIN") ? Math.max(weatherPenalty, congestion) : path.includes("MYPKG") ? 0.33 : 0.2;
    return {
      id: `route-${index + 1}`, route: path, nauticalMiles: miles, transitHours: Math.round(transit),
      cost: Math.round(fuel * 640 + delay * 850), carbon: Math.round(fuel * carbonPerFuelTon),
      delay: Math.round(delay), risk: severityFor(risk), recommended: index === 0,
      rationale: "Network distance + weather penalty + berth wait + fuel and delay assumptions."
    };
  }).sort((a, b) => a.transitHours - b.transitHours);
  options[0].recommended = true;
  return {
    scenario: "Vessel Network Disruption Recovery", synthetic: true, simulationMinutes: minutes,
    vessel: {
      name: "MV Horizon Relay", mmsi: "477001234", position: [+(8.8 - hours * 0.18).toFixed(2), +(112 + hours * 0.42).toFixed(2)],
      speed: +(Math.max(11.8, 16.3 - storm * 2.8 + Math.sin(hours / 1.7) * 0.4)).toFixed(1), nextPort: "SGSIN"
    },
    disruption: {
      type: closure ? "Port closure" : congestion >= 0.75 ? "Port congestion" : "Weather escalation",
      severity: closure ? "severe" : severityFor(Math.max(congestion, weatherPenalty)),
      description: closure ? "Singapore is closed under simulated pilot suspension." : `Singapore congestion ${(congestion * 100).toFixed(0)}%; weather routing penalty ${(weatherPenalty * 100).toFixed(0)}%.`
    },
    signals: { congestion: +congestion.toFixed(2), berthWait: +berthWait.toFixed(1), weatherPenalty: +weatherPenalty.toFixed(2), closure },
    options,
    map: { ports, planned: ["CNSHA", "SGSIN", "AEMZA", "NLRTM"] },
    audit: { deterministicMethod: "Route graph enumeration with published distance, fuel, carbon, weather, and berth assumptions.", standards: ["DCSA Port Call-aligned port status", "DCSA Track & Trace-style voyage visibility"] }
  };
}

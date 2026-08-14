export const pricingBase = {
  lane: "Shanghai (CNSHA) → Rotterdam (NLRTM)",
  currency: "USD / 40HC",
  baseRate: 2420,
  demandIndex: 112,
  capacityIndex: 86,
  laneImbalance: 0.34,
  portCongestion: 0.62,
  scheduleReliability: 0.79,
  bunkerIndex: 1.08,
  emptyCost: 180,
  carbonCost: 42,
  competitorIndex: 1.03,
  disruption: "port-congestion"
};

export const mockEvidence = {
  pricing: [{
    title: "Synthetic Asia-Europe capacity watch",
    url: "https://example.invalid/synthetic/asia-europe-capacity",
    snippet: "Simulated advisory signal: capacity remains constrained while terminal queues are elevated.",
    timestamp: "2026-08-14T03:00:00Z",
    sourceType: "simulated market bulletin"
  }],
  vessel: [{
    title: "Synthetic Singapore weather and terminal advisory",
    url: "https://example.invalid/synthetic/singapore-advisory",
    snippet: "Simulated advisory signal: thunderstorm risk is escalating alongside berth waiting time.",
    timestamp: "2026-08-14T03:00:00Z",
    sourceType: "simulated port bulletin"
  }],
  containers: [{
    title: "Synthetic equipment demand shift",
    url: "https://example.invalid/synthetic/equipment-demand",
    snippet: "Simulated advisory signal: North Europe export demand is lifting 40HC deficit pressure.",
    timestamp: "2026-08-14T03:00:00Z",
    sourceType: "simulated equipment bulletin"
  }]
};

export const ports = {
  CNSHA: { name: "Shanghai", x: 12, y: 45 },
  SGSIN: { name: "Singapore", x: 29, y: 68 },
  MYPKG: { name: "Port Klang", x: 35, y: 73 },
  AEMZA: { name: "Jebel Ali", x: 57, y: 53 },
  ESALG: { name: "Algeciras", x: 78, y: 35 },
  NLRTM: { name: "Rotterdam", x: 90, y: 21 }
};

export const routeLinks = [
  ["CNSHA", "SGSIN", 2450, 132],
  ["CNSHA", "MYPKG", 2320, 126],
  ["SGSIN", "AEMZA", 3760, 206],
  ["MYPKG", "AEMZA", 3900, 215],
  ["AEMZA", "NLRTM", 7220, 394],
  ["AEMZA", "ESALG", 3430, 188],
  ["ESALG", "NLRTM", 1080, 62]
];

export const containerPorts = [
  { code: "CNSHA", name: "Shanghai", surplus: { "40HC": 310, "40GP": 180, "20GP": 60 }, capacity: 620 },
  { code: "SGSIN", name: "Singapore", surplus: { "40HC": 90, "40GP": -65, "20GP": 80 }, capacity: 450 },
  { code: "AEMZA", name: "Jebel Ali", surplus: { "40HC": -180, "40GP": 70, "20GP": -110 }, capacity: 360 },
  { code: "NLRTM", name: "Rotterdam", surplus: { "40HC": -260, "40GP": -120, "20GP": 40 }, capacity: 500 },
  { code: "ESALG", name: "Algeciras", surplus: { "40HC": 140, "40GP": 120, "20GP": -20 }, capacity: 310 }
];

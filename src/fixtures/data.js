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

export const ports = {
  CNSHA: { name: "Shanghai", latitude: 31.23, longitude: 121.47 },
  SGSIN: { name: "Singapore", latitude: 1.29, longitude: 103.85 },
  MYPKG: { name: "Port Klang", latitude: 3.0, longitude: 101.4 },
  AEMZA: { name: "Jebel Ali", latitude: 25.01, longitude: 55.06 },
  ESALG: { name: "Algeciras", latitude: 36.13, longitude: -5.45 },
  NLRTM: { name: "Rotterdam", latitude: 51.92, longitude: 4.48 }
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

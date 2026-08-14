import { containerPorts } from "../fixtures/data.js";

const distances = { "CNSHA-NLRTM": 10500, "CNSHA-AEMZA": 6300, "ESALG-NLRTM": 1080, "ESALG-AEMZA": 3400, "SGSIN-AEMZA": 3900, "CNSHA-SGSIN": 2450 };

export function calculateContainerMoves({ equipment = "40HC", priority = "balanced" } = {}) {
  const supplies = containerPorts.filter((port) => port.surplus[equipment] > 0).map((port) => ({ ...port, units: port.surplus[equipment] }));
  const deficits = containerPorts.filter((port) => port.surplus[equipment] < 0).map((port) => ({ ...port, units: Math.abs(port.surplus[equipment]) }));
  const candidates = [];
  for (const origin of supplies) {
    for (const destination of deficits) {
      const distance = distances[`${origin.code}-${destination.code}`] || distances[`${destination.code}-${origin.code}`] || 5800;
      const units = Math.min(origin.units, destination.units, Math.floor(origin.capacity * 0.65), Math.floor(destination.capacity * 0.65));
      const cost = Math.round(distance * units * 0.19);
      const carbon = Math.round(distance * units * 0.000021);
      const service = Math.round(destination.units / 10 + (destination.code === "NLRTM" ? 12 : 4));
      const score = priority === "cost" ? cost / 1000 - service : priority === "service" ? -service + carbon / 100 : cost / 1700 + carbon / 30 - service;
      candidates.push({ origin: origin.code, destination: destination.code, units, distance, cost, carbon, service, score: +score.toFixed(1) });
    }
  }
  const moves = candidates.sort((a, b) => a.score - b.score).slice(0, 4).map((move, index) => ({ ...move, rank: index + 1, constraint: move.units >= 200 ? "Terminal release capacity is binding." : "Equipment release and nominated vessel slots available." }));
  const moved = moves.reduce((sum, move) => sum + move.units, 0);
  return {
    scenario: "Empty Container Utilization Across Ports", synthetic: true, equipment, priority,
    ports: containerPorts.map((port) => ({ code: port.code, name: port.name, balance: port.surplus[equipment], capacity: port.capacity })),
    moves,
    impact: { moved, utilization: Math.round(moved / containerPorts.reduce((sum, port) => sum + port.capacity, 0) * 100), cost: moves.reduce((sum, move) => sum + move.cost, 0), carbon: moves.reduce((sum, move) => sum + move.carbon, 0), servicePoints: moves.reduce((sum, move) => sum + move.service, 0) },
    audit: { deterministicMethod: "Match equipment surplus to deficit, cap by synthetic terminal release capacity, rank by selected transparent objective.", standards: ["GS1 EPCIS 2.0-style equipment visibility", "DCSA Track & Trace-aligned location codes"] }
  };
}

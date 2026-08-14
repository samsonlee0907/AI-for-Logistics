const capturedAt = "2026-08-15T03:46:33+08:00";

const snapshotSource = (sourceType, title, url, snippet) => ({
  title,
  url,
  snippet,
  timestamp: capturedAt,
  sourceType: `Point-in-time snapshot — ${sourceType}`,
  capturedAt
});

const evidence = {
  pricing: [
    snapshotSource(
      "Freight market",
      "Ocean Freight Market Update",
      "https://www.dhl.com/us-en/home/global-forwarding/latest-news-and-webinars/ocean-freight-market-update.html",
      "Captured 15 August 2026. This market-update reference was selected for Asia-Europe capacity, schedule reliability, and surcharge context. Treat it as a dated planning input and verify current carrier terms before quoting."
    ),
    snapshotSource(
      "Route disruption",
      "Red Sea & Hormuz Shipping Crisis 2026",
      "https://www.mightyshipping.com/en/blog/2026-07-01-hormuz-reopening-july-freight-outlook",
      "Captured 15 August 2026. The research snapshot describes continuing route-security volatility and the potential for diversion-related transit, insurance, and capacity effects. It is not a live security advisory."
    )
  ],
  vessel: [
    snapshotSource(
      "Origin weather and port conditions",
      "Asia Supply Chain Weather Center: Typhoon Dolphin",
      "https://www.sekologistics.com/hk-en/resources/asia-supply-chain-weather-center-live-port-freight-updates/",
      "Captured 15 August 2026. This dated weather/port reference was selected for potential East China terminal recovery, berth-window, and schedule-recovery context. Verify current marine notices and port instructions before voyage execution."
    ),
    snapshotSource(
      "Destination and network disruption",
      "Typhoon Closures & Cape Rerouting Amplify Far East-Europe Supply Chain Disruption",
      "https://www.chemanalyst.com/NewsAndDeals/NewsDetails/typhoon-closures-cape-rerouting-amplify-far-east-europe-43861",
      "Captured 15 August 2026. The research snapshot highlights potential Far East-Europe arrival bunching and European gateway congestion. It provides decision context only and does not replace official weather, port, or navigational notices."
    )
  ],
  containers: [
    snapshotSource(
      "Port operational restrictions",
      "Port Operational Updates from Around the World",
      "https://mykn.kuehne-nagel.com/news/article/port-operational-updates-from-11-08-2026",
      "Captured 15 August 2026. This dated operational-update reference was selected for regional terminal restrictions, congestion, and equipment-flow context. Confirm current release rules with each terminal and carrier."
    ),
    snapshotSource(
      "Equipment market",
      "Freight Market Update: August 13th, 2026",
      "https://www.explorate.co/freight-market-updates/august-13th-2026",
      "Captured 15 August 2026. The snapshot describes uneven capacity and equipment availability across trade lanes. It can inform prioritization reasoning but cannot alter synthetic balances or capacity constraints."
    )
  ]
};

export function snapshotEvidenceFor(topic) {
  return structuredClone(evidence[topic] || []);
}

export { capturedAt as snapshotCapturedAt };

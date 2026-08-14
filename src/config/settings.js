import fs from "node:fs";
import path from "node:path";

const settingsPath = path.resolve("config", "local-settings.json");

const defaults = Object.freeze({
  webIq: {
    enabled: process.env.WEBIQ_ENABLED === "true",
    apiKey: process.env.WEBIQ_API_KEY || ""
  }
});

function readLocalSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

let settings = {
  webIq: { ...defaults.webIq, ...(readLocalSettings().webIq || {}) }
};

function persist() {
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), { mode: 0o600 });
}

export function getSettings() {
  return structuredClone(settings);
}

export function updateSettings(next) {
  settings = {
    webIq: { ...settings.webIq, ...next.webIq }
  };
  persist();
  return getSettings();
}

export function publicProviderStatus() {
  return {
    webIq: {
      enabled: settings.webIq.enabled,
      configured: Boolean(settings.webIq.apiKey),
      mode: settings.webIq.enabled ? "live" : "snapshot"
    },
    foundry: {
      embedded: true,
      configured: Boolean(process.env.FOUNDRY_ENDPOINT && process.env.FOUNDRY_DEPLOYMENT),
      mode: process.env.FOUNDRY_ENDPOINT && process.env.FOUNDRY_DEPLOYMENT ? "managed-identity" : "mock"
    }
  };
}

import { createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "logistics_portal_session";
const sessionLifetimeSeconds = 8 * 60 * 60;

const parseCookies = (header = "") => Object.fromEntries(header.split(";").map((value) => value.trim().split(/=(.*)/s)).filter(([key, value]) => key && value).map(([key, value]) => [key, decodeURIComponent(value)]));
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const equal = (left, right) => {
  const leftValue = Buffer.from(left);
  const rightValue = Buffer.from(right);
  return leftValue.length === rightValue.length && timingSafeEqual(leftValue, rightValue);
};

export function createPortalAuth(environment = process.env) {
  const username = environment.PORTAL_AUTH_USERNAME;
  const password = environment.PORTAL_AUTH_PASSWORD;
  const secret = environment.PORTAL_AUTH_SESSION_SECRET;
  if (!username || !password || !secret || secret.length < 32) {
    throw new Error("Portal authentication requires PORTAL_AUTH_USERNAME, PORTAL_AUTH_PASSWORD, and a PORTAL_AUTH_SESSION_SECRET of at least 32 characters.");
  }
  const signature = (payload) => createHmac("sha256", secret).update(payload).digest("base64url");
  const issueSession = () => {
    const payload = encode({ username, expiresAt: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds });
    return `${payload}.${signature(payload)}`;
  };
  const isAuthenticated = (request) => {
    const token = parseCookies(request.headers.cookie)[cookieName];
    if (!token) return false;
    const [payload, providedSignature] = token.split(".");
    if (!payload || !providedSignature || !equal(signature(payload), providedSignature)) return false;
    try {
      const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      return session.username === username && Number.isInteger(session.expiresAt) && session.expiresAt > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  };
  const cookieAttributes = `HttpOnly; Path=/; SameSite=Strict; Max-Age=${sessionLifetimeSeconds}${environment.NODE_ENV === "production" ? "; Secure" : ""}`;
  return {
    isAuthenticated,
    login(request, response) {
      const { username: submittedUsername = "", password: submittedPassword = "" } = request.body || {};
      if (typeof submittedUsername !== "string" || typeof submittedPassword !== "string" || !equal(submittedUsername, username) || !equal(submittedPassword, password)) {
        return response.status(401).json({ error: "Invalid username or password." });
      }
      response.setHeader("Set-Cookie", `${cookieName}=${issueSession()}; ${cookieAttributes}`);
      return response.json({ authenticated: true });
    },
    logout(_request, response) {
      response.setHeader("Set-Cookie", `${cookieName}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${environment.NODE_ENV === "production" ? "; Secure" : ""}`);
      return response.status(204).end();
    }
  };
}

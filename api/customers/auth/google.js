import { env, getBackendUrl, isConfiguredSecret } from "../../_lib/auth.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const clientId = env("GOOGLE_CLIENT_ID");
  if (!isConfiguredSecret(clientId)) {
    return res.status(500).end("GOOGLE_CLIENT_ID is not configured");
  }

  const redirectUri = `${getBackendUrl(req)}/api/customers/auth/google/callback`;
  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("access_type", "offline");
  googleUrl.searchParams.set("prompt", "select_account");

  return res.redirect(302, googleUrl.toString());
}

import { env, getBackendUrl, getFrontendUrl, isConfiguredSecret, signToken } from "../../../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const frontendUrl = getFrontendUrl();
  const errorRedirect = (message) => {
    const url = new URL("/login", frontendUrl);
    url.searchParams.set("error", message);
    return res.redirect(302, url.toString());
  };

  try {
    const { code, error } = req.query;
    if (error) return errorRedirect(String(error));
    if (!code) return errorRedirect("missing_google_code");

    const clientId = env("GOOGLE_CLIENT_ID");
    const clientSecret = env("GOOGLE_CLIENT_SECRET");
    const jwtSecret = env("JWT_SECRET", "SESSION_SECRET");

    if (!isConfiguredSecret(clientId) || !isConfiguredSecret(clientSecret) || !isConfiguredSecret(jwtSecret)) {
      return errorRedirect("google_auth_not_configured");
    }

    const redirectUri = `${getBackendUrl(req)}/api/customers/auth/google/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      return errorRedirect("google_token_exchange_failed");
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json();

    if (!profileResponse.ok || !profile.email) {
      return errorRedirect("google_profile_failed");
    }

    const token = signToken({
      sub: profile.id || profile.email,
      email: profile.email,
      name: profile.name || profile.email,
      picture: profile.picture || null,
      role: "user",
    });

    const successUrl = new URL("/oauth-success", frontendUrl);
    successUrl.searchParams.set("token", token);
    successUrl.searchParams.set("role", "user");
    return res.redirect(302, successUrl.toString());
  } catch (err) {
    return errorRedirect("google_auth_failed");
  }
}

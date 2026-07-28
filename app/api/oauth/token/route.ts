import { NextRequest, NextResponse } from "next/server";
import { consumeAuthorizationCode, issueTokens, rotateRefreshToken } from "@/lib/mcp/oauth";

async function readParams(req: NextRequest): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await req.json()) as Record<string, string>;
  }
  const formData = await req.formData();
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

function errorResponse(error: string, description?: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status });
}

/** OAuth 2.0 token endpoint — authorization_code (with PKCE) and refresh_token grants. */
export async function POST(req: NextRequest) {
  let params: Record<string, string>;
  try {
    params = await readParams(req);
  } catch {
    return errorResponse("invalid_request", "Could not parse request body.");
  }

  const grantType = params.grant_type;

  if (grantType === "authorization_code") {
    const { code, redirect_uri: redirectUri, client_id: clientId, code_verifier: codeVerifier } = params;
    if (!code || !redirectUri || !clientId || !codeVerifier) {
      return errorResponse("invalid_request", "code, redirect_uri, client_id, and code_verifier are required.");
    }

    try {
      const { email } = await consumeAuthorizationCode({ code, clientId, redirectUri, codeVerifier });
      const tokens = await issueTokens({ clientId, email });
      return NextResponse.json({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_type: "Bearer",
        expires_in: tokens.expiresIn,
      });
    } catch (err) {
      return errorResponse("invalid_grant", err instanceof Error ? err.message : "Invalid authorization code.");
    }
  }

  if (grantType === "refresh_token") {
    const { refresh_token: refreshToken, client_id: clientId } = params;
    if (!refreshToken || !clientId) {
      return errorResponse("invalid_request", "refresh_token and client_id are required.");
    }

    try {
      const tokens = await rotateRefreshToken({ clientId, refreshToken });
      return NextResponse.json({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_type: "Bearer",
        expires_in: tokens.expiresIn,
      });
    } catch (err) {
      return errorResponse("invalid_grant", err instanceof Error ? err.message : "Invalid refresh token.");
    }
  }

  return errorResponse("unsupported_grant_type", `Unsupported grant_type: ${grantType}`);
}

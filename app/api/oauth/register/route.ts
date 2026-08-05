import { NextRequest, NextResponse } from "next/server";
import { registerClient } from "@/lib/mcp/oauth";

/**
 * OAuth 2.0 Dynamic Client Registration (RFC 7591). Open/unauthenticated —
 * registering a client is harmless on its own; the actual data access still
 * requires an allowlisted user to approve it at the /oauth/authorize consent
 * screen, which shows the client name and redirect target.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400 });
  }

  const { redirect_uris, client_name } = (body ?? {}) as {
    redirect_uris?: unknown;
    client_name?: unknown;
  };

  if (!Array.isArray(redirect_uris) || redirect_uris.length === 0 || !redirect_uris.every((u) => typeof u === "string")) {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: "redirect_uris must be a non-empty array of strings." },
      { status: 400 }
    );
  }

  let client;
  try {
    client = await registerClient({
      redirectUris: redirect_uris,
      clientName: typeof client_name === "string" ? client_name : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "invalid_redirect_uri",
        error_description: err instanceof Error ? err.message : "Invalid redirect_uris.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      client_id: client.id,
      client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
      client_name: client.clientName ?? undefined,
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
    { status: 201 }
  );
}

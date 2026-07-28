"use server";

import { redirect } from "next/navigation";
import { getAuthorizedUser } from "@/lib/auth";
import { getClient, createAuthorizationCode } from "@/lib/mcp/oauth";

async function validatedClient(formData: FormData) {
  const clientId = String(formData.get("client_id") ?? "");
  const redirectUri = String(formData.get("redirect_uri") ?? "");

  const client = await getClient(clientId);
  if (!client || !(client.redirectUris as string[]).includes(redirectUri)) {
    throw new Error("Invalid client or redirect_uri.");
  }

  return { clientId, redirectUri };
}

function withState(url: URL, formData: FormData) {
  const state = formData.get("state");
  if (state) url.searchParams.set("state", String(state));
  return url;
}

export async function approveAuthorization(formData: FormData) {
  const user = await getAuthorizedUser();
  if (!user?.email) throw new Error("Unauthorized");

  const { clientId, redirectUri } = await validatedClient(formData);
  const codeChallenge = String(formData.get("code_challenge") ?? "");

  const code = await createAuthorizationCode({
    clientId,
    email: user.email,
    redirectUri,
    codeChallenge,
  });

  const url = withState(new URL(redirectUri), formData);
  url.searchParams.set("code", code);
  redirect(url.toString());
}

export async function denyAuthorization(formData: FormData) {
  const { redirectUri } = await validatedClient(formData);

  const url = withState(new URL(redirectUri), formData);
  url.searchParams.set("error", "access_denied");
  redirect(url.toString());
}

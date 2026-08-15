import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/hero/card";
import { Button } from "@/components/ui/hero/button";
import { getAuthorizedUser } from "@/lib/auth";
import { getClient } from "@/lib/mcp/oauth";
import { approveAuthorization, denyAuthorization } from "./actions";

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Can&apos;t continue</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function HiddenFields({
  clientId,
  redirectUri,
  codeChallenge,
  state,
}: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state?: string;
}) {
  return (
    <>
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="redirect_uri" value={redirectUri} />
      <input type="hidden" name="code_challenge" value={codeChallenge} />
      {state && <input type="hidden" name="state" value={state} />}
    </>
  );
}

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const {
    response_type: responseType,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    state,
  } = params;

  if (responseType !== "code" || !clientId || !redirectUri || !codeChallenge) {
    return <ErrorCard message="Missing or invalid OAuth authorization request parameters." />;
  }

  if (codeChallengeMethod && codeChallengeMethod !== "S256") {
    return <ErrorCard message="Unsupported code_challenge_method — only S256 is supported." />;
  }

  let redirectHost: string;
  try {
    redirectHost = new URL(redirectUri).host;
  } catch {
    return <ErrorCard message="Invalid redirect_uri." />;
  }

  const client = await getClient(clientId);
  if (!client || !(client.redirectUris as string[]).includes(redirectUri)) {
    return <ErrorCard message="Unknown OAuth client or unregistered redirect_uri." />;
  }

  const user = await getAuthorizedUser();
  if (!user) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    redirect(`/login?next=${encodeURIComponent(`/oauth/authorize?${qs}`)}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Allow access?</CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">{client.clientName || "An MCP client"}</span> wants
            to access your Moore Money data as{" "}
            <span className="font-medium text-foreground">{user.email}</span>, then return you to{" "}
            <span className="font-medium text-foreground">{redirectHost}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p>
              Anyone can register an app with any name — &quot;{client.clientName || "An MCP client"}&quot;
              is not independently verified. Only trust this if you recognise{" "}
              <span className="font-medium text-foreground">{redirectHost}</span>{" "}
              as the app you&apos;re connecting, and this ID:{" "}
              <code className="font-mono text-foreground">{client.id}</code>.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Grants the same access as a personal access token — accounts, transactions,
            categories, and rules. You can revoke this anytime from Settings.
          </p>
          <div className="flex gap-2">
            <form action={approveAuthorization} className="flex-1">
              <HiddenFields
                clientId={clientId}
                redirectUri={redirectUri}
                codeChallenge={codeChallenge}
                state={state}
              />
              <Button type="submit" className="w-full">
                Allow
              </Button>
            </form>
            <form action={denyAuthorization} className="flex-1">
              <HiddenFields
                clientId={clientId}
                redirectUri={redirectUri}
                codeChallenge={codeChallenge}
                state={state}
              />
              <Button type="submit" variant="outline" className="w-full">
                Deny
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

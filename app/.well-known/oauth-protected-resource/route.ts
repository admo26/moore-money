import { NextRequest } from "next/server";
import { protectedResourceHandler, metadataCorsOptionsRequestHandler } from "mcp-handler";

/** Points MCP clients at this app's own authorization server (see /.well-known/oauth-authorization-server). */
export const GET = (req: NextRequest) =>
  protectedResourceHandler({
    authServerUrls: [new URL("/", req.url).origin],
  })(req);

export const OPTIONS = metadataCorsOptionsRequestHandler();

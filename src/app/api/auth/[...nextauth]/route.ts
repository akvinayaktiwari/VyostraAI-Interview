import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { AUTH_DISABLED, LOCAL_SESSION } from "@/lib/local-auth";

const handler = NextAuth(authOptions);

type RouteContext = { params: { nextauth: string[] } };

// With the local auth bypass on, the client's session fetch must return the local user too,
// otherwise useSession() overwrites the provider's initial session with an empty one.
async function GET(req: Request, ctx: RouteContext): Promise<Response> {
  if (AUTH_DISABLED && ctx.params.nextauth.join("/") === "session") {
    return NextResponse.json(LOCAL_SESSION);
  }
  return handler(req, ctx);
}

export { GET, handler as POST };

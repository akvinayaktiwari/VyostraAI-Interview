import { NextResponse, type NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";
import { AUTH_DISABLED } from "@/lib/local-auth";

const authMiddleware = withAuth({
  pages: {
    signIn: "/login",
  },
});

const AUTH_PAGES: readonly string[] = ["/login", "/register"];

function localTestingMiddleware(req: NextRequest): NextResponse {
  if (AUTH_PAGES.includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export default AUTH_DISABLED ? localTestingMiddleware : authMiddleware;

export const config = {
  matcher: [
    "/",
    "/new",
    "/dashboard/:path*",
    "/review/:path*",
    "/questions/:path*",
    "/compare/:path*",
    "/team/:path*",
    "/templates/:path*",
    "/login",
    "/register",
  ],
};

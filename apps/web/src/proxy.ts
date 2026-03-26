import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("bearer_token")?.value;
  const { pathname } = request.nextUrl;

  const isSignIn = pathname === "/";
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isSignIn && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};

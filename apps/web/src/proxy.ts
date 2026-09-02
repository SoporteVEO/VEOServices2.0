import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("bearer_token")?.value;
  const { pathname, searchParams } = request.nextUrl;

  const isSignIn = pathname === "/";
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/mantenimiento");

  // A QR code opened on a phone usually lands here unauthenticated, so we
  // remember the target and hand the user back to it after signing in.
  if (isProtected && !token) {
    const signIn = new URL("/", request.url);
    signIn.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signIn);
  }

  if (isSignIn && token) {
    const redirect = searchParams.get("redirect");
    return NextResponse.redirect(new URL(redirect ?? "/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/portal/:path*",
    "/mantenimiento/:path*",
  ],
};

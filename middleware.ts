import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  const publicRoutes = ["/login", "/api/auth"];
  const isPublicRoute = publicRoutes.some((r) => nextUrl.pathname.startsWith(r));
  const isAuthApiRoute = nextUrl.pathname.startsWith("/api/auth");

  if (isPublicRoute || isAuthApiRoute) {
    if (isLoggedIn && nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const adminRoutes = ["/reports", "/settings", "/activity-log", "/admin"];
  const isAdminRoute = adminRoutes.some((r) => nextUrl.pathname.startsWith(r));
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*\\.js).*)",
  ],
};

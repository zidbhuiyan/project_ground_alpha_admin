import { NextResponse } from "next/server";

export function middleware(req) {
  const session = req.cookies.get("admin_session");
  const { pathname } = req.nextUrl;

  // ------ PUBLIC ROUTES ------
  const publicRoutes = ["/"]; // login page

  // ------ PROTECTED ROUTES ------
  const protectedRoutes = [
    "/dashboard",
    "/add_admin",
    "/schedule",
    "/schedule-management",
    "/rate-management",
    "/event-management",
  ];

  // If logged in and tries to visit login page → redirect to dashboard
  if (session && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect all admin pages
  if (!session && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/", // login page
    "/dashboard/:path*", // dashboard
    "/add_admin/:path*", // add admin
    "/schedule/:path*", // schedule
    "/schedule-management/:path*",
    "/rate-management/:path*",
    "/event-management/:path*",
  ],
};

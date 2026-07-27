import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, checkAdminPassword, createSessionToken } from "@/lib/admin/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = formData.get("password");

  const url = new URL(request.url);
  const invalid = typeof password !== "string" || !checkAdminPassword(password);

  if (invalid) {
    url.pathname = "/admin/login";
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, { status: 303 });
  }

  url.pathname = "/admin";
  url.search = "";
  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Not scoped to "/admin" — the admin API lives under "/api/admin",
    // a sibling path the cookie would otherwise never be sent to.
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return response;
}

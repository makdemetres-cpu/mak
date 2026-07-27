import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";

export async function POST(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/admin/login";
  url.search = "";
  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.delete({ name: ADMIN_SESSION_COOKIE, path: "/" });
  return response;
}

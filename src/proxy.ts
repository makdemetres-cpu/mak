import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export const proxy = createMiddleware(routing);

export const config = {
  // /admin is an internal tool outside the bilingual marketing site — it
  // has its own root layout (src/app/admin/layout.tsx) and shouldn't be
  // run through locale detection/redirects at all.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};

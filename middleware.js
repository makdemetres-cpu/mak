/* ===========================================================================
   Vet Care — password gate for the client preview deployment
   ---------------------------------------------------------------------------
   Vercel's own Password Protection is a paid Pro add-on. This does the same job
   on the free Hobby plan, as Edge Middleware: every request is stopped here
   before it reaches a single file of the site.

   WHAT IT DOES
     · No cookie      → the login page, whatever was asked for.
     · Correct password → an HttpOnly cookie, then on to the site.
     · Every response → X-Robots-Tag: noindex, nofollow.
     · /robots.txt    → disallow everything, without touching the repo's real
                        robots.txt, which the live site still needs.
     · Any *.php      → 404. Vercel has no PHP runtime, and an unrun .php file
                        can be handed out as source. Nothing here is secret
                        (config.php is git-ignored and never deployed), but
                        there is no reason to publish the moderation page's
                        source to anyone who guesses the filename.

   THE COOKIE IS NOT THE PASSWORD
     It holds an HMAC of the password under a fixed label. Nobody can forge one
     without knowing the password, it never travels in readable form, and
     changing PREVIEW_PASSWORD invalidates every cookie already issued.

   SET THIS BEFORE DEPLOYING
     Vercel → Project → Settings → Environment Variables → PREVIEW_PASSWORD.
     With it unset the gate denies everything rather than opening: a preview
     that silently loses its password should fail shut, not fall open.

   REMOVING IT FOR THE REAL LAUNCH
     Delete this file. The gate, the noindex header and the robots override all
     go with it, because none of them are written into the site itself.
   =========================================================================== */

const COOKIE = "vetcare_preview";
const LABEL = "vetcare-preview-gate-v1";
const MAX_AGE = 60 * 60 * 24 * 7; /* a week, then sign in again */

/* Paths the gate has to let through, or nobody could ever log in. */
const OPEN_PATHS = new Set(["/login", "/login/"]);

export const config = {
  /* Everything. Assets included — a preview that gates the pages but serves
     the images and copy to anyone is not a gate. */
  matcher: "/(.*)",
};

/* Compare without leaking, through timing, how much of a value was right. */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function tokenFor(password) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(LABEL));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

/* Both the header and the robots override are added on the way out, so they
   apply to every response the gate lets through without the site itself
   carrying a single noindex tag into production. */
function withPreviewHeaders(response) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

function html(body, status, extraHeaders) {
  return withPreviewHeaders(
    new Response(body, {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        ...(extraHeaders || {}),
      },
    })
  );
}

function loginPage(message) {
  /* Self-contained: no stylesheet, no script, no font — nothing from the
     gated site is fetched, so the login screen cannot leak the site's assets
     to someone who has not signed in. Inline CSS only, which the site's own
     Content-Security-Policy already permits. */
  return `<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Vet Care — προεπισκόπηση</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100svh; display: grid; place-items: center;
    padding: 1.5rem; background: #f6f1e7; color: #23372f;
    font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  .card {
    width: min(26rem, 100%); background: #fffdf9; padding: 2rem 1.75rem;
    border: 1px solid #e2d9c9; border-radius: 18px;
    box-shadow: 0 12px 32px rgba(35, 55, 47, 0.08);
  }
  h1 { margin: 0 0 0.35rem; font-size: 1.3rem; }
  p { margin: 0 0 1.4rem; color: #5c6b63; font-size: 0.94rem; }
  label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.4rem; }
  input {
    width: 100%; min-height: 48px; padding: 0.6rem 0.85rem; font: inherit;
    border: 1px solid #cfc4b1; border-radius: 10px; background: #fff;
  }
  input:focus-visible { outline: 3px solid #9db3a5; outline-offset: 1px; }
  button {
    width: 100%; min-height: 48px; margin-top: 1rem; font: inherit; font-weight: 600;
    color: #fffdf9; background: #a4552f; border: 0; border-radius: 999px; cursor: pointer;
  }
  button:hover { background: #8f4826; }
  .err {
    margin: 0 0 1rem; padding: 0.7rem 0.9rem; border-radius: 10px;
    background: #fdf1ee; border: 1px solid #eec6bd; color: #8c2c1b; font-size: 0.9rem;
  }
</style>
</head>
<body>
  <main class="card">
    <h1>Vet Care</h1>
    <p>Προεπισκόπηση για τον πελάτη. Εισάγετε τον κωδικό για να συνεχίσετε.</p>
    ${message ? `<p class="err">${message}</p>` : ""}
    <form method="post" action="/login">
      <label for="pw">Κωδικός</label>
      <input id="pw" name="password" type="password" autocomplete="current-password"
             autofocus required>
      <button type="submit">Είσοδος</button>
    </form>
  </main>
</body>
</html>`;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const secret = process.env.PREVIEW_PASSWORD;

  /* Fail shut. An unset password must not mean an open site. */
  if (!secret) {
    return html(
      loginPage(
        "Ο κωδικός προεπισκόπησης δεν έχει οριστεί. Ορίστε το PREVIEW_PASSWORD " +
          "στις μεταβλητές περιβάλλοντος του Vercel."
      ),
      503
    );
  }

  const expected = await tokenFor(secret);
  const authed = safeEqual(readCookie(request, COOKIE) || "", expected);

  /* ------------------------------------------------------------- sign in */
  if (OPEN_PATHS.has(path)) {
    if (request.method === "POST") {
      let supplied = "";
      try {
        supplied = String((await request.formData()).get("password") || "");
      } catch {
        supplied = "";
      }
      if (!safeEqual(supplied, secret)) {
        /* 401, not a redirect: a wrong password should not look like success. */
        return html(loginPage("Λάθος κωδικός."), 401);
      }
      const response = new Response(null, { status: 303, headers: { location: "/" } });
      response.headers.append(
        "set-cookie",
        `${COOKIE}=${expected}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`
      );
      return withPreviewHeaders(response);
    }
    /* Already in? No reason to ask again. */
    if (authed) {
      return withPreviewHeaders(new Response(null, { status: 303, headers: { location: "/" } }));
    }
    return html(loginPage(""), 200);
  }

  /* --------------------------------------------------------- the gate */
  if (!authed) {
    return html(loginPage(""), 401);
  }

  /* --------------------------------- past the gate, but still a preview */

  /* Vercel cannot execute PHP, so these would be dead at best and served as
     source at worst. */
  if (path.toLowerCase().endsWith(".php")) {
    return withPreviewHeaders(new Response("Not found", { status: 404 }));
  }

  /* Keep the preview out of search results without editing the repo's own
     robots.txt, which the live site still needs as it is. */
  if (path === "/robots.txt") {
    return withPreviewHeaders(
      new Response("User-agent: *\nDisallow: /\n", {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      })
    );
  }
  if (path === "/sitemap.xml") {
    return withPreviewHeaders(new Response("Not found", { status: 404 }));
  }

  /* Let the request through, tagged noindex on the way back out. */
  return withPreviewHeaders(
    new Response(null, {
      headers: { "x-middleware-next": "1" },
    })
  );
}

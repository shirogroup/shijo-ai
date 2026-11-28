import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge-compatible JWT decode (no Node.js dependencies)
// Full cryptographic verification happens in API routes via lib/auth.ts
function decodeJWTPayload(token: string): { userId: string; email: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64url decode the payload
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const decoded = JSON.parse(atob(payload));

    // Check expiry
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }

    if (!decoded.userId || !decoded.email) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

function hostname(request: NextRequest): string {
  return (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
}

function barePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function middleware(request: NextRequest) {
  // learn.shijo.ai serves the free Module 1 lesson. Other paths on this host
  // (including /pricing) still rewrite to the lesson so product and plan pages
  // are not shown here. www.shijo.ai and shijo.ai permanently redirect
  // /learn and /learn/visibility-log in next.config.ts. Those rules are
  // host-scoped and exact, so they do not run on this host and they do
  // not cover /learn/sitemap.xml.
  //
  // Public URLs on this host:
  //   /                → app route /learn (Module 1)
  //   /visibility-log  → app route /learn/visibility-log
  //   /sitemap.xml     → app route /learn/sitemap.xml (learn URLs only)
  //   /robots.txt is host-aware in app/robots.ts and is not rewritten
  //   /unsubscribe     → app route /learn/unsubscribe (query token kept)
  //   /downloads/visibility-log.md is the worksheet file and is not rewritten.
  if (hostname(request) === "learn.shijo.ai") {
    const url = request.nextUrl.clone();
    const path = barePath(url.pathname);

    // /robots.txt and /sitemap.xml are also matched below (the general
    // matcher skips other .txt/.xml files). Let robots.txt through so
    // app/robots.ts can branch on this host. Rewrite sitemap.xml to the
    // learn-only sitemap; otherwise this host would serve the www urlset.
    if (path === "/robots.txt") {
      return NextResponse.next();
    }

    if (path === "/sitemap.xml") {
      url.pathname = "/learn/sitemap.xml";
      return NextResponse.rewrite(url);
    }

    if (path === "/downloads/visibility-log.md") {
      return NextResponse.next();
    }

    // Module 1 email capture. The catch-all below would rewrite this to the
    // lesson HTML, so the form on this host could never reach the route.
    if (path.startsWith("/api/learn/")) {
      return NextResponse.next();
    }

    // One-click unsubscribe. Preserve the token query. The catch-all below
    // would rewrite this to the lesson and drop the query.
    if (path === "/unsubscribe") {
      url.pathname = "/learn/unsubscribe";
      return NextResponse.rewrite(url);
    }

    if (path === "/learn/unsubscribe") {
      return NextResponse.next();
    }

    if (path === "/") {
      url.pathname = "/learn";
      return NextResponse.rewrite(url);
    }

    if (path === "/visibility-log") {
      url.pathname = "/learn/visibility-log";
      return NextResponse.rewrite(url);
    }

    // The app routes also work, but the public URLs above are canonical.
    if (path === "/learn") {
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (path === "/learn/visibility-log") {
      url.pathname = "/visibility-log";
      url.search = "";
      return NextResponse.redirect(url);
    }

    url.pathname = "/learn";
    url.search = "";
    return NextResponse.rewrite(url);
  }

  const { pathname } = request.nextUrl;

  // Protected routes — /admin additionally requires isAdmin, which is
  // checked server-side in /api/admin/* routes against the database (not
  // here, since this Edge middleware only decodes the JWT payload without
  // verifying its signature — see decodeJWTPayload above).
  const protectedRoutes = ['/dashboard', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check session cookie
  const token = request.cookies.get('session')?.value;

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Decode and check expiry (Edge-compatible, no jsonwebtoken)
  const payload = decodeJWTPayload(token);

  if (!payload) {
    // Invalid or expired token — clear it and redirect
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete('session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Broader than the previous dashboard/admin-only matcher so the
  // learn.shijo.ai host rewrite can run on every page request. Static
  // assets and Next internals are excluded. Auth checks below still
  // apply only to /dashboard and /admin.
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|icon.svg|apple-icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
    // The pattern above excludes .txt and .xml, which is why learn.shijo.ai
    // used to serve the www robots file and the 23-URL www sitemap. These
    // two paths are matched on purpose so the host branch above can run.
    "/robots.txt",
    "/sitemap.xml",
  ],
};

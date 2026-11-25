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
  return (request.headers.get("host") ?? "").split(":")[0];
}

export function middleware(request: NextRequest) {
  // learn.shijo.ai always serves the coming-soon training landing, including
  // paths such as /pricing, so the main product and plan pages are not shown
  // on this host. www.shijo.ai / shijo.ai are unchanged.
  if (hostname(request) === "learn.shijo.ai") {
    const url = request.nextUrl.clone();
    if (url.pathname !== "/learn") {
      url.pathname = "/learn";
      url.search = "";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
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
  ],
};

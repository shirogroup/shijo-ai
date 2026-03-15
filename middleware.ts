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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ['/dashboard'];
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
  matcher: ['/dashboard/:path*'],
};

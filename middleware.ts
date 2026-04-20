import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// List of public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/signup', '/api/auth/login', '/api/auth/signup'];

// Inline JWT verification for middleware to avoid import issues
function verifyTokenInMiddleware(token: string): boolean {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    console.log('[Middleware Auth] Verifying token with secret length:', secret.length);
    jwt.verify(token, secret);
    console.log('[Middleware Auth] Token verified successfully');
    return true;
  } catch (error) {
    console.error('[Middleware Auth] Token verification failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes and static assets
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For all other routes, require authentication
  const token = request.cookies.get('auth_token')?.value;
  console.log(`[Middleware] Request to ${pathname}, token present:`, !!token);

  if (!token) {
    // No token, redirect to login
    console.log(`[Middleware] No token found for ${pathname}, redirecting to login`);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  console.log(`[Middleware] Token length: ${token.length}, first 20 chars: ${token.substring(0, 20)}...`);

  // Verify token validity
  if (!verifyTokenInMiddleware(token)) {
    // Token is invalid or expired
    console.log(`[Middleware] Invalid token for ${pathname}, redirecting to login`);
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  // Token is valid, allow the request
  console.log(`[Middleware] Token valid for ${pathname}, allowing request`);
  return NextResponse.next();
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes don't redirect, they respond)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};

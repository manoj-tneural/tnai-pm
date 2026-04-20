import { NextRequest, NextResponse } from 'next/server';

// List of public routes that don't require authentication
// NOTE: /dashboard and /test are temporarily added for debugging - remove these once dashboard is fixed!
const publicRoutes = ['/auth/login', '/auth/signup', '/api/auth/login', '/api/auth/signup', '/dashboard', '/test'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes and static assets
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For all other routes, require authentication
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // No token, redirect to login
    console.log(`[Middleware] No token found for ${pathname}, redirecting to login`);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Token exists, allow the request
  // JWT verification will happen in API routes and server components
  console.log(`[Middleware] Token present for ${pathname}, allowing request`);
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

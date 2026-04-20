import { NextRequest, NextResponse } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/signup', '/api/auth/login', '/api/auth/signup'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    console.log(`[Middleware] Public route: ${pathname}`);
    return NextResponse.next();
  }

  // For protected routes, check for auth_token
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    console.log(`[Middleware] No auth_token for ${pathname}, redirecting to login`);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

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

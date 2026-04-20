import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-jwt';

// List of public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/signup'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Redirect to dashboard if already logged in
    const token = request.cookies.get('auth_token')?.value;
    if (token && verifyToken(token)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protect /api/auth routes
  if (pathname.startsWith('/api/auth')) {
    // Allow login and signup endpoints without cookies
    if (pathname.endsWith('/login') || pathname.endsWith('/signup')) {
      return NextResponse.next();
    }
    // Require auth for other /api/auth routes (like logout)
    const token = request.cookies.get('auth_token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protect app routes - require authentication
  if (pathname.startsWith('/')) {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Verify token validity
    const decoded = verifyToken(token);
    if (!decoded) {
      // Token is invalid or expired
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    // Protect all app routes except public ones
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

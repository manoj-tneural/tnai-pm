import { NextRequest, NextResponse } from 'next/server';

// TEMPORARILY DISABLED FOR DEBUGGING
// All routes are now public - fix this after verifying login works!

export function middleware(request: NextRequest) {
  // Allow everything through for now
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

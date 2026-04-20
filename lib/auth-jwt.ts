// JWT-only utilities - safe for middleware and edge runtime
// Does NOT import bcrypt (native module) or other server-only packages

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token (safe for middleware/edge runtime)
export function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

// Extract token from headers
export function getTokenFromHeaders(headers: any): string | null {
  const authHeader = typeof headers === 'object' 
    ? (headers.authorization || headers.Authorization || '') 
    : '';
  
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Extract token from HTTP Headers object (adds type safety)
export function getTokenFromHttpHeaders(headers: Headers): string | null {
  const authHeader = headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

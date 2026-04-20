// This file has been deprecated in favor of custom JWT + PostgreSQL authentication
// See CUSTOM_AUTH_README.md for details

export function createClient() {
  throw new Error('Supabase client has been removed. Use /api/auth/* endpoints instead.');
}

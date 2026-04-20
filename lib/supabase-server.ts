// This file has been deprecated in favor of custom JWT + PostgreSQL authentication
// See CUSTOM_AUTH_README.md for details

export function createServerSupabaseClient() {
  throw new Error('Supabase server client has been removed. Use /api/* endpoints with custom auth instead.');
}

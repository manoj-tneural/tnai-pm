/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for pages that require runtime environment
  staticPageGenerationTimeout: 120,
  // Skip prerendering auth pages since they require Supabase client at runtime
  experimental: {
    optimizePackageImports: ['@supabase/auth-js', '@supabase/ssr'],
  },
};

module.exports = nextConfig;

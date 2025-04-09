/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Comment out the export output as it's not compatible with Supabase auth
  // output: 'export',
  images: {
    unoptimized: true,
  },
  experimental: {
    forceSwcTransforms: true, // Use SWC for faster builds
    // Add esmExternals true to help with Supabase module resolution
    esmExternals: true,
  },
  // Add transpilePackages for Supabase
  transpilePackages: ['@supabase/supabase-js', '@supabase/ssr'],
}

module.exports = nextConfig

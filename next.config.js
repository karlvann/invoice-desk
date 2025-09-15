/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force development server to use port 3000
  // This doesn't prevent Next.js from switching ports, but helps with consistency
  env: {
    PORT: '3000',
  },
  
  // Don't fail build on linting warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable React production profiling (helps identify performance bottlenecks)
  reactStrictMode: true,
  
  // Optimize image handling
  images: {
    // Define allowed domains for external images if needed
    domains: [],
    // Enable image optimization
    unoptimized: false,
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false, // Disable source maps to reduce memory usage
  
  // Experimental features for better performance
  experimental: {
    // Disable server source maps for production (saves memory)
    serverSourceMaps: false,
    
    // Optimize imports for heavy packages
    optimizePackageImports: [
      'lucide-react', // Icon library optimization
      '@stripe/react-stripe-js',
      '@stripe/stripe-js',
    ],
  },
  
  // Compress responses
  compress: true,
  
  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        // Cache static assets
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

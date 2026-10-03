import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  // Ensures static export writes privacy-policy/index.html instead of privacy-policy.html
  // so the local preview server (`serve -s out`) resolves paths correctly.
  trailingSlash: true,
  // Images configuration
  images: {
    // This allows all images, local or external, to load without optimization
    unoptimized: true,
    // Every image the site renders is localized under public/; no remote
    // image hosts are allowed.
    remotePatterns: [],
  },
  // Optional: base path and asset prefix if using a subdirectory deployment
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
}

export default nextConfig

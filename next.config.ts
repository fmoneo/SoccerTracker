import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/SoccerTracker',
  assetPrefix: '/SoccerTracker/',
  images: {
    unoptimized: true, // Required for static export image handling
  },
};

export default nextConfig;
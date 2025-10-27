import path from 'path';
import { fileURLToPath } from 'url';

// Replicate __dirname functionality in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for the Docker build
  output: 'standalone',

  // --- THE DEFINITIVE FIX ---
  // Explicitly disable the conflicting styled-jsx compiler.
  // This prevents Next.js from trying to use it during the static export phase.
  compiler: {
    styledJsx: false,
  },
  
  // Whitelist local image uploads for the Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },

  // Preserve the critical webpack alias configuration for path mapping
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['youtube-dl-exec', '@distube/ytdl-core'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
  // Exclude Python virtual environments from file tracing.
  // venv can exist at project root or inside data/ — both contain
  // symlinks that point outside the project root and crash Turbopack.
  outputFileTracingExcludes: {
    '*': ['**/venv/**', 'venv/**', 'data/venv/**'],
  },
};

export default nextConfig;

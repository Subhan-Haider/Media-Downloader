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
  // Exclude the Python virtual environment from Turbopack file tracing.
  // On Linux, venv/bin/python is a symlink that points outside the project root,
  // which causes a Turbopack panic during `next build`.
  outputFileTracingExcludes: {
    '*': ['venv/**', 'venv/bin/**'],
  },
};

export default nextConfig;

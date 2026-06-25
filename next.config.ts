import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['youtube-dl-exec', '@distube/ytdl-core'],
};

export default nextConfig;

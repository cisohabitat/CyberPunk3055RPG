import type { NextConfig } from "next";
import beds from "./qa/media/bed-delivery.json";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return beds.beds.map(({ name }) => ({ source: `/audio/${name}.flac`, headers: [
      { key: "Content-Encoding", value: "gzip" },
      { key: "Content-Type", value: "audio/flac" },
    ] }));
  },
  async rewrites() {
    return { beforeFiles: beds.beds.map(({ name }) => ({ source: `/audio/${name}.flac`, destination: `/audio/${name}.flac.gz` })), afterFiles: [], fallback: [] };
  },
};

export default nextConfig;

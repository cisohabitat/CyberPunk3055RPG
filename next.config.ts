import type { NextConfig } from "next";
import beds from "./qa/media/bed-delivery.json";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The game ships native responsive images; it has no optimizer clients.
  images: { unoptimized: true },
  async headers() {
    // Static App Router hydration includes inline scripts. A nonce would make
    // these routes dynamic; do not claim this policy blocks inline script XSS.
    const policy = [
      "default-src 'self'", "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:", "font-src 'self'", "media-src 'self' blob:", "connect-src 'self'",
      "object-src 'none'", "base-uri 'none'", "frame-src 'none'", "frame-ancestors 'none'", "form-action 'self'",
    ].join("; ");
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
      ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: policy }] : []),
    ] }, ...beds.beds.map(({ name }) => ({ source: `/audio/${name}.flac`, headers: [
      { key: "Content-Encoding", value: "gzip" },
      { key: "Content-Type", value: "audio/flac" },
    ] }))];
  },
  async rewrites() {
    return { beforeFiles: beds.beds.map(({ name }) => ({ source: `/audio/${name}.flac`, destination: `/audio/${name}.flac.gz` })), afterFiles: [], fallback: [] };
  },
};

export default nextConfig;

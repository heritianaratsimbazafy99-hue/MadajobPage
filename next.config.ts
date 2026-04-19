import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const remotePatterns = (() => {
  if (!supabaseUrl) {
    return [];
  }

  try {
    const parsed = new URL(supabaseUrl);

    return [
      {
        protocol: parsed.protocol.replace(":", "") as "http" | "https",
        hostname: parsed.hostname,
        pathname: "/storage/v1/object/**"
      }
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd()
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns
  }
};

export default nextConfig;

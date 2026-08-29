import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the Turbopack project root to this directory. A stray
  // package-lock.json in the parent "Premium Websites" folder (outside this
  // git repo) otherwise makes Next.js misdetect the project root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;

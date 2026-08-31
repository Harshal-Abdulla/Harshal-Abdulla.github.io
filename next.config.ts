import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export. There is no server, no API route and no runtime environment
  // variable anywhere in this project. `next build` writes a folder of files
  // that any static host can serve, which is what makes the site outlive
  // anyone's attention.
  output: "export",
  images: {
    unoptimized: true,
  },
  // Emit `/about/index.html` rather than `/about.html`, so GitHub Pages serves
  // the same URLs the dev server does.
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;

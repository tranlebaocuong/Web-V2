import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Dynamic process.cwd() paths make file tracing pull in the whole repo.
  // Keep docs, ops files and git metadata out of the server bundle.
  outputFileTracingExcludes: {
    "*": [
      ".git/**",
      ".env*",
      "*.md",
      "Dockerfile",
      "docker-compose*.yml",
      "Caddyfile",
      "*.bat",
      "deploy/**",
      "docs/**",
      "reports/**",
      "scratch/**",
      "scripts/**",
      "data/**",
      "SenTrang_Gravity_Handoff_V1_3/**",
      "TAI LIEU NGANH DONG/**",
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Dynamic process.cwd() paths make file tracing pull in the whole repo.
  // Keep docs, ops files and git metadata out of the server bundle.
  outputFileTracingExcludes: {
    "*": [
      ".git/**",
      // Netlify/Next build output and caches (the server handler lives in
      // .netlify, so tracing it would recursively nest previous bundles).
      ".netlify/**",
      ".next/cache/**",
      "node_modules/.cache/**",
      // Build-time / local-only tooling that is never needed at runtime.
      "node_modules/**/typescript/**",
      "node_modules/**/prisma/build/**",
      "node_modules/**/@prisma/engines/**",
      "node_modules/**/@electric-sql/pglite/**",
      "node_modules/**/pglite-server/**",
      "node_modules/**/@swc/core*/**",
      "node_modules/**/esbuild/**",
      "node_modules/**/@esbuild/**",
      // Netlify Functions run on Amazon Linux (rhel-openssl-3.0.x); the
      // Debian engine is only needed for local builds.
      "node_modules/**/libquery_engine-debian-*",
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

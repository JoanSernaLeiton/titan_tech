import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  typedRoutes: true,
  logging: {
    browserToTerminal: true,
  },
  turbopack: {
    root: import.meta.dirname,
  },
  headers: () => Promise.resolve([
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // TODO: replace 'unsafe-inline' with nonce-based CSP
            // 'unsafe-eval' is added in dev only for React's debugging features (never in production)
            `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self'",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
          ].join("; "),
        },
      ],
    },
  ]),
};

export default nextConfig;

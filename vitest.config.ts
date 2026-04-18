import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "src/e2e/**", ".claude/**", ".next/**"],
    coverage: {
      provider: "v8",
      thresholds: {
        branches: 90,
        functions: 95,
        lines: 95,
        statements: 95,
      },
      exclude: [
        "node_modules/**",
        "src/e2e/**",
        "src/shared/db/migrations/**",
        "**/*.config.*",
        "**/index.ts",
        "src/app/globals.css",
        ".next/**",
        "next-env.d.ts",
        "**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});

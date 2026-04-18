import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import importPlugin from "eslint-plugin-import-x";
import vitestPlugin from "eslint-plugin-vitest";
import playwrightPlugin from "eslint-plugin-playwright";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin,
      "import-x": importPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "no-console": "error",
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowNullableEnum: false,
          allowAny: false,
        },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "default", format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "variable", format: ["camelCase", "UPPER_CASE", "PascalCase"], leadingUnderscore: "allow" },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "enumMember", format: ["PascalCase"] },
        { selector: "import", format: null },
        { selector: "property", format: null },
        { selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow" },
      ],
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc" },
        },
      ],
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    plugins: { vitest: vitestPlugin },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/naming-convention": "off",
    },
  },
  {
    files: ["src/e2e/**/*.spec.ts"],
    plugins: { playwright: playwrightPlugin },
    rules: {
      ...playwrightPlugin.configs["flat/recommended"].rules,
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/naming-convention": "off",
    },
  },
  {
    files: ["**/error.tsx"],
    rules: { "no-console": "off" },
  },
  {
    // TODO: @supabase/ssr exports createServerClient as deprecated while the replacement
    // API is not yet stable. Remove this override once the package provides a non-deprecated alternative.
    files: ["src/shared/lib/supabase/server.ts", "src/shared/lib/supabase/middleware.ts"],
    rules: { "@typescript-eslint/no-deprecated": "off" },
  },
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "coverage/**", "eslint.config.ts", "next-env.d.ts", "next.config.ts", "playwright.config.ts", "drizzle.config.ts", "vitest.config.ts", "postcss.config.mjs"],
  }
);

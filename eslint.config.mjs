import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

// Import your rules from the old config
const customRules = {
  "array-callback-return": "error",
  "eqeqeq": "error",
  "no-alert": "error",
  "no-return-assign": "error",
  // Add other rules as needed from your .eslintrc.json file
};

export default [
  { 
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], 
    plugins: { js }, 
    rules: {
      ...js.configs.recommended.rules,
      ...customRules
    },
    linterOptions: {
      reportUnusedDisableDirectives: true // Migrated from old config
    }
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "script" } },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: pluginReact
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: "detect" // Automatically detect React version
      }
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // Disable the React import requirement for JSX
      "react/prop-types": "off", // Optional: Disable prop-types as you're using TypeScript
      "@typescript-eslint/no-explicit-any": "warn", // Downgrade any type to warning
      "@typescript-eslint/no-unused-vars": "warn", // Downgrade unused vars to warning
      "@typescript-eslint/no-empty-object-type": "warn" // Downgrade empty object type to warning
    }
  },
  {
    ignores: ["**/node_modules/**", "build/**", ".next/**", "dist/**"] // Equivalent to old ignorePatterns
  }
];

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import {defineConfig} from "eslint/config";


export default defineConfig([
  {ignores: ['dist', 'coverage']},
  {
    files: ["src/**/*.ts"],
    plugins: {js},
    extends: ["js/recommended"],
    rules: {
      "eol-last": ["error", "always"],
      "no-trailing-spaces": "error",
      "indent": ["error", 2]
    }
  },
  {files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], languageOptions: {globals: globals.browser}},
  tseslint.configs.recommended,
]);

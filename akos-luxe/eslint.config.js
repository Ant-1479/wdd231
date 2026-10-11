import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["js/**/*.js"],
    languageOptions: { ecmaVersion: 2023, sourceType: "script", globals: globals.browser },
    rules: { "no-unused-vars": "warn", eqeqeq: "error" },
  },
];

module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "no-console": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-unused-vars": "warn",
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "CallExpression[callee.object.name='console'][callee.property.name='log']",
        message:
          "Uso de console.log no permitido. Usa console.error si es necesario.",
      },
    ],
    "@typescript-eslint/no-unused-vars": "warn",
  },
};

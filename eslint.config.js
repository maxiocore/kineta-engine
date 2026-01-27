import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // 🚫 Block imports from legacy financing paths
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["@/components/financing/status*", "@/components/financing/dashboard*", "@/components/admin/financing*"],
            "message": "Legacy financing components are decommissioned. Use V2 from @/components/financing/v2/"
          },
          {
            "group": ["@/hooks/useFinancingContract*"],
            "message": "Legacy hook removed. Use V2 hooks from @/components/financing/v2/hooks/"
          },
          {
            "group": ["@/lib/financing/hooks*", "@/lib/financing/statusNormalizer*"],
            "message": "Legacy lib removed. Use V2 from @/components/financing/v2/utils/statusNormalizer"
          }
        ]
      }],
    },
  },
);

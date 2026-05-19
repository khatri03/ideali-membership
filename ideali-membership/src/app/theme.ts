import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const membershipTheme = defineConfig({
  cssVarsPrefix: "ideali",
  globalCss: {
    body: {
      backgroundColor: "app.bg",
      color: "app.text",
    },
    "::selection": {
      backgroundColor: "app.selectionBg",
      color: "app.selectionText",
    },
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#ecfeff" },
          100: { value: "#cffafe" },
          200: { value: "#a5f3fc" },
          300: { value: "#67e8f9" },
          400: { value: "#22d3ee" },
          500: { value: "#06b6d4" },
          600: { value: "#0891b2" },
          700: { value: "#0e7490" },
          800: { value: "#155e75" },
          900: { value: "#164e63" },
        },
        app: {
          bg: { value: "#f7fbff" },
          bgAlt: { value: "#eef6ff" },
          surface: { value: "#ffffff" },
          surfaceAlt: { value: "#f8fbff" },
          border: { value: "#dbe7f1" },
          borderStrong: { value: "#c7d6e2" },
          text: { value: "#0f172a" },
          muted: { value: "#64748b" },
          subtle: { value: "#94a3b8" },
          selectionBg: { value: "#cffafe" },
          selectionText: { value: "#082f49" },
        },
      },
      radii: {
        app: {
          panel: { value: "1.5rem" },
          card: { value: "1.25rem" },
          pill: { value: "9999px" },
        },
      },
      shadows: {
        app: {
          panel: { value: "0 16px 48px rgba(15, 23, 42, 0.08)" },
          floating: { value: "0 24px 60px rgba(15, 23, 42, 0.14)" },
          inset: { value: "inset 0 1px 0 rgba(255, 255, 255, 0.7)" },
        },
      },
    },
  },
});

export const membershipSystem = createSystem(defaultConfig, membershipTheme);

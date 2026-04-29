import type { Config } from "tailwindcss";

/**
 * Tailwind-Konfiguration für apps/storefront.
 *
 * Farbwelt nach CLAUDE.md:
 *   brand.text   #1C1C1E  – Primärtext (Headlines, Body)
 *   brand.muted  #6B7280  – Sekundärtext, Labels, Subtexte
 *   brand.accent #22C55E  – Energie-Grün: CTAs, positive Badges
 *
 * Schriften:
 *   font-display → Sora  (Headlines, Produktnamen)
 *   font-sans    → Inter (Body, Labels, UI-Text)
 *
 * Beide Schriften werden per next/font/google als CSS-Custom-Properties
 * (--font-sora, --font-inter) in layout.tsx eingebunden.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          text: "#1C1C1E",
          muted: "#6B7280",
          accent: "#22C55E",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;

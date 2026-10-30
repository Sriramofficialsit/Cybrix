import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f1633",
        violet: {
          DEFAULT: "#7c3aed",
          deep: "#5b21b6",
          deepest: "#4c1d95",
          soft: "#9560ea",
        },
        cyan: { brand: "#2f9fe0" },
        ground: "#f4f2f9",
        lime: { brand: "#c2ef4e" },
        pink: { brand: "#fa7faa" },
      },
      fontFamily: {
        sans: ["var(--font-rubik)", "system-ui", "sans-serif"],
        display: ["var(--font-grotesk)", "system-ui", "sans-serif"],
        mono: ["Monaco", "Menlo", "Ubuntu Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

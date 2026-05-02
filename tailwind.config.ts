import type { Config } from "tailwindcss";

// Tokens come from sheine-design/templates/sheine-app.DESIGN.md.
// Editing here? Edit DESIGN.md too.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          dark: "#020c1b",
          mid: "#0a192f",
          card: "#112240",
          elev2: "#1a2c4e",
        },
        text: {
          white: "#e6f1ff",
          gray: "#8892b0",
          dim: "#495670",
        },
        gold: {
          DEFAULT: "#FFD700",
          soft: "#d4af37",
        },
        cyan: { DEFAULT: "#64ffda" },
        rose: { DEFAULT: "#ff6b6b" },
        amber: { DEFAULT: "#ffb86c" },
        border: {
          subtle: "#1c2942",
          strong: "#2c3f6d",
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
      },
      letterSpacing: {
        'cinzel-tight': '-0.01em',
        'label': '0.06em',
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

// Light palette. Vercel/Linear/shadcn-influenced.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#fafafa",        // page canvas
          surface: "#ffffff",     // cards, inputs
          subtle: "#f4f4f5",      // alternating rows, hover
          accent: "#f0f9ff",      // active selection / cyan tint
        },
        ink: {
          900: "#09090b",         // primary text
          700: "#27272a",         // secondary heading
          500: "#52525b",         // body secondary
          400: "#71717a",         // muted
          300: "#a1a1aa",         // disabled / dim
        },
        line: {
          subtle: "#e4e4e7",
          strong: "#d4d4d8",
        },
        brand: {
          DEFAULT: "#2563eb",     // primary accent (blue)
          soft:    "#3b82f6",
        },
        success: { DEFAULT: "#16a34a", soft: "#22c55e" },
        warn:    { DEFAULT: "#d97706", soft: "#f59e0b" },
        danger:  { DEFAULT: "#dc2626", soft: "#ef4444" },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
      },
      letterSpacing: {
        'label': '0.06em',
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
};
export default config;

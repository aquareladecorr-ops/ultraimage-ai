import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Darkroom editorial palette
        ink: {
          DEFAULT: "#0c0a08",  // primary background
          deep: "#0a0807",      // secondary background
          card: "#161310",      // hover/cards
          line: "#2a2520",      // borders
        },
        bone: {
          DEFAULT: "#f5ede0",   // primary text
          dim: "#a39a8b",       // secondary text
        },
        copper: {
          DEFAULT: "#d4a574",   // accent
          deep: "#c8553d",      // warning/secondary accent
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        editorial: "-0.02em",
      },
      animation: {
        "marquee": "marquee 40s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-33.33%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0e14",
        panel: "#141925",
        panel2: "#1b2230",
        border: "#252d3d",
        muted: "#8b97ad",
        text: "#e6e9ef",
        accent: "#5b8cff",
        easy: "#22c55e",
        medium: "#f59e0b",
        hard: "#ef4444",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

/** Every colour resolves to a CSS custom property defined in app/globals.css. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: token("surface"),
          raised: token("surface-raised"),
          overlay: token("surface-overlay"),
          sunken: token("surface-sunken"),
        },
        line: {
          DEFAULT: token("line"),
          strong: token("line-strong"),
        },
        fg: {
          DEFAULT: token("fg"),
          muted: token("fg-muted"),
          subtle: token("fg-subtle"),
        },
        brand: {
          DEFAULT: token("brand"),
          fg: token("brand-fg"),
        },
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
        flame: token("flame"),
        diff: {
          easy: token("diff-easy"),
          medium: token("diff-medium"),
          hard: token("diff-hard"),
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // Product type scale. Body sits at 14px; the display sizes are reserved
        // for the gamified hero moments and the landing page.
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        xs: ["0.75rem", { lineHeight: "1.125rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.875rem", { lineHeight: "1.375rem" }],
        md: ["0.9375rem", { lineHeight: "1.5rem" }],
        lg: ["1.0625rem", { lineHeight: "1.5rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.015em" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.02em" }],
        stat: ["2.125rem", { lineHeight: "1", letterSpacing: "-0.025em" }],
        display: ["2.75rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "display-lg": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.035em" }],
      },
      borderRadius: {
        card: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        pop: "0 8px 30px -8px rgb(0 0 0 / 0.35)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;

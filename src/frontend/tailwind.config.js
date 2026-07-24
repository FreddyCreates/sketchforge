import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        sketch: "2px 3px 0 0 oklch(0.2 0.01 280 / 0.12)",
        "sketch-lg": "3px 5px 0 0 oklch(0.2 0.01 280 / 0.16)",
        glow: "0 0 0 1px oklch(0.62 0.22 285 / 0.3), 0 4px 18px -2px oklch(0.62 0.22 285 / 0.45), 0 0 28px -4px oklch(0.62 0.22 285 / 0.5)",
        "glow-lg": "0 0 0 1px oklch(0.62 0.22 285 / 0.35), 0 8px 28px -4px oklch(0.62 0.22 285 / 0.55), 0 0 44px -6px oklch(0.62 0.22 285 / 0.6)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "thinking-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.96)" },
        },
        "thinking-dot": {
          "0%, 80%, 100%": { opacity: "0.25", transform: "translateY(0)" },
          "40%": { opacity: "1", transform: "translateY(-2px)" },
        },
        "glow-breathe": {
          "0%, 100%": { boxShadow: "0 0 0 1px oklch(0.62 0.22 285 / 0.3), 0 4px 18px -2px oklch(0.62 0.22 285 / 0.45), 0 0 28px -4px oklch(0.62 0.22 285 / 0.5)" },
          "50%": { boxShadow: "0 0 0 1px oklch(0.62 0.22 285 / 0.45), 0 8px 30px -2px oklch(0.62 0.22 285 / 0.65), 0 0 52px -4px oklch(0.62 0.22 285 / 0.75)" },
        },
        "sketch-draw": {
          "0%": { strokeDashoffset: "100", opacity: "0" },
          "100%": { strokeDashoffset: "0", opacity: "1" },
        },
        "lasso-march": {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "-16" },
        },
        "cursor-pulse": {
          "0%, 100%": { transform: "translateY(0)", opacity: "1" },
          "50%": { transform: "translateY(-1px)", opacity: "0.85" },
        },
        "panel-slide-in-left": {
          from: { transform: "translateX(-100%)", opacity: "0.4" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "panel-slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0.4" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "thinking-pulse": "thinking-pulse 1.4s ease-in-out infinite",
        "thinking-dot": "thinking-dot 1.2s ease-in-out infinite",
        "glow-breathe": "glow-breathe 2.2s ease-in-out infinite",
        "sketch-draw": "sketch-draw 0.6s ease-out forwards",
        "lasso-march": "lasso-march 0.8s linear infinite",
        "cursor-pulse": "cursor-pulse 1.6s ease-in-out infinite",
        "panel-slide-left": "panel-slide-in-left 0.28s cubic-bezier(0.4, 0, 0.2, 1) both",
        "panel-slide-right": "panel-slide-in-right 0.28s cubic-bezier(0.4, 0, 0.2, 1) both",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens (light/dark via CSS variables in index.css).
        brand: {
          DEFAULT: "#0EA99A",
          dark: "rgb(var(--brand-dark) / <alpha-value>)",
          light: "#3FC9BA",
          faint: "rgb(var(--brand-faint) / <alpha-value>)",
        },
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        danger: "#D9482B",
        warn: "#E0A03A",
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 18px rgba(10,91,98,0.08)",
        soft: "0 1px 3px rgba(10,91,98,0.06)",
      },
    },
  },
  plugins: [],
};

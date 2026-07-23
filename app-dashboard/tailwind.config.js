/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // MyHealthyGlucose brand palette
        brand: {
          DEFAULT: "#0EA99A",
          dark: "#0A5B62",
          light: "#3FC9BA",
          faint: "#E7F7F3",
        },
        ink: "#1E2F32",
        muted: "#5A6D6D",
        line: "#DCEEEC",
        canvas: "#F6FBFA",
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

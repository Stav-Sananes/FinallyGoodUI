/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#3b82f6", foreground: "#ffffff" },
        ink: "#111827",
      },
      spacing: { "18": "4.5rem", gutter: "24px" },
      borderRadius: { card: "12px" },
      fontFamily: { display: ["Fraunces", "serif"] },
    },
  },
  plugins: [],
};

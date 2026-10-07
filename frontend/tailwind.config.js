/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        surface2: "rgb(var(--color-surface2) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        accent: "#14b8a6",
        accent2: "#3b82f6",
      },
      backgroundImage: {
        "glow-gradient": "radial-gradient(circle at 20% 20%, rgba(20,184,166,0.14), transparent 40%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.12), transparent 40%)",
      },
      boxShadow: {
        glass: "0 18px 50px rgba(2,8,23,0.28)",
      },
    },
  },
  plugins: [],
};

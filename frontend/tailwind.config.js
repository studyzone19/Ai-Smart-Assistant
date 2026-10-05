/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0b0b14",
        surface: "#13131f",
        surface2: "#1a1a2a",
        border: "#272740",
        accent: "#8b5cf6",
        accent2: "#06b6d4",
      },
      backgroundImage: {
        "glow-gradient": "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.18), transparent 40%), radial-gradient(circle at 80% 0%, rgba(6,182,212,0.15), transparent 40%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};

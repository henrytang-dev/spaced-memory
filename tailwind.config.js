/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          900: "#05070f",
          800: "#0a0f1f",
          700: "#0f1728"
        },
        accent: {
          DEFAULT: "#78f3ff",
          200: "#99f7ff",
          400: "#54d2ff"
        }
      },
      boxShadow: {
        glow: "0 10px 60px rgba(120, 243, 255, 0.2)"
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 20%, rgba(120, 243, 255, 0.15), transparent 45%), radial-gradient(circle at 80% 0%, rgba(130, 84, 255, 0.2), transparent 35%)"
      }
    }
  },
  plugins: []
};

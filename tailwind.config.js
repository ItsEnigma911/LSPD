/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0E17",
          900: "#0E1420",
          800: "#161D2B",
          700: "#202A3D",
          600: "#2B3A55",
        },
        brass: {
          400: "#D4B876",
          500: "#B8934A",
          600: "#96742F",
        },
        alert: {
          500: "#A6332F",
        },
        bone: {
          100: "#E9EAEC",
          400: "#8B93A7",
        },
      },
      fontFamily: {
        display: ["'Oswald'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

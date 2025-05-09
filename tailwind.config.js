// tailwind.config.js
module.exports = {
  // Usamos "class" para activar el dark mode agregando la clase "dark" al elemento raíz
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      // Aquí puedes extender la paleta de colores, fuentes, etc.
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out",
        pulseWidth: "pulseWidth 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulseWidth: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.7 },
        },
      },
      transitionDelay: {
        100: "100ms",
        200: "200ms",
        300: "300ms",
        400: "400ms",
        500: "500ms",
      },
    },
  },
  plugins: [require("@tailwindcss/aspect-ratio")],
};

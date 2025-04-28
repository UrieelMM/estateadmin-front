// tailwind.config.js
module.exports = {
  // Usamos "class" para activar el dark mode agregando la clase "dark" al elemento raíz
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      // Aquí puedes extender la paleta de colores, fuentes, etc.
    },
  },
  plugins: [require("@tailwindcss/aspect-ratio")],
};

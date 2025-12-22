/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'verde-primario': '#28a745',
        'verde-secundario': '#20c997',
        'verde-claro': '#d4edda',
        'verde-oscuro': '#155724',
      },
    },
  },
  plugins: [],
}


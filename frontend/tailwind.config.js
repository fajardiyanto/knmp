/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pertamina: {
          blue: "#004B87",
          red: "#ED1C24",
          green: "#8DC63F",
          dark: "#002B49",
          light: "#EBF3FA"
        }
      }
    },
  },
  plugins: [],
}

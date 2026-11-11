/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./client/src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#123c2d",
        leaf: "#347a46",
        gold: "#d0a444",
        cream: "#f7f6f0",
      },
    },
  },
  plugins: [],
};

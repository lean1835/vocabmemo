/** @type {import('tailwindcss').Config} */

export default {

  content: [

    "./index.html",

    "./src/**/*.{js,ts,jsx,tsx}",

  ],

  darkMode: "class",

  theme: {

    extend: {

      colors: {

        primary: {

          purple: "#7c4dff",

          purpleLight: "#b59cff",

          dark: "#0f172a",

          darkCard: "#1e293b",

        }

      },

      fontFamily: {

        sans: ["Inter", "sans-serif"],

      }

    },

  },

  plugins: [],

}
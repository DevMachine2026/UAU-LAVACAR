/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        uau: {
          teal:   "#009688",
          maroon: "#7D1C2F",
          green:  "#0BA95B",
          black:  "#101418",
          gray:   "#667085",
          light:  "#F5F7FA",
          white:  "#FFFFFF"
        }
      }
    }
  },
  plugins: []
};

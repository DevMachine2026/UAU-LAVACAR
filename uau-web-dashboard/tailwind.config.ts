import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        uau: {
          green: "#0BA95B",
          black: "#101828",
          gray: "#667085",
          light: "#F5F7FA"
        }
      }
    }
  },
  plugins: []
};

export default config;

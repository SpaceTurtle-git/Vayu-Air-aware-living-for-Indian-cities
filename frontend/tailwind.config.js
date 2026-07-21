/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dusk: "#0F1B2D",      // deep dusk-sky base
        dusk2: "#14213D",
        haze: "#9FB3D1",      // hazy blue-grey for secondary text
        ember: "#E8734A",     // warning/pollution accent (not the generic terracotta — used sparingly, only for alerts)
        mist: "#F3F6FA",      // light surface
        good: "#4CBB6C",
        satisfactory: "#A0C93D",
        moderate: "#F4C542",
        poor: "#F08A3C",
        verypoor: "#E24A4A",
        severe: "#8B2E4C",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

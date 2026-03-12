/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#050712",
        card: "#101322",
        accent: "#50f5ff",
        accentSoft: "#1b3a4a"
      },
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "sans-serif"]
      },
      boxShadow: {
        neon: "0 0 25px rgba(80, 245, 255, 0.35)"
      }
    }
  },
  plugins: []
};

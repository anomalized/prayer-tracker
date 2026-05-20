/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nude: {
          50:  "#fdf6f2",
          100: "#fdf0eb",
          200: "#fae4dc",
          300: "#f0c8bc",
          400: "#e8a898",
          500: "#d4786a",
          600: "#c4917a",
          700: "#a06050",
          800: "#7a4035",
          900: "#5a2820",
        },
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        body:    ["'Lato'", "sans-serif"],
      },
      colors: {
        theme: {
          bg: "var(--color-bg-primary)",
          surface: "var(--color-surface)",
          accent: "var(--color-accent)",
          'accent-dark': "var(--color-accent-dark)",
          border: "var(--color-border)",
          text: "var(--color-text-primary)",
          muted: "var(--color-text-muted)",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

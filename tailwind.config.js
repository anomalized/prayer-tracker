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
          50:  "var(--nude-50)",
          100: "var(--nude-100)",
          200: "var(--nude-200)",
          300: "var(--nude-300)",
          400: "var(--nude-400)",
          500: "var(--nude-500)",
          600: "var(--nude-600)",
          700: "var(--nude-700)",
          800: "var(--nude-800)",
          900: "var(--nude-900)",
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

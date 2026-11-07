/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          50: 'rgb(var(--color-charcoal-50) / <alpha-value>)',
          100: 'rgb(var(--color-charcoal-100) / <alpha-value>)',
          200: 'rgb(var(--color-charcoal-200) / <alpha-value>)',
          300: 'rgb(var(--color-charcoal-300) / <alpha-value>)',
          400: 'rgb(var(--color-charcoal-400) / <alpha-value>)',
          500: 'rgb(var(--color-charcoal-500) / <alpha-value>)',
          600: 'rgb(var(--color-charcoal-600) / <alpha-value>)',
          700: 'rgb(var(--color-charcoal-700) / <alpha-value>)',
          800: 'rgb(var(--color-charcoal-800) / <alpha-value>)',
          900: 'rgb(var(--color-charcoal-900) / <alpha-value>)',
          950: 'rgb(var(--color-charcoal-950) / <alpha-value>)',
        },
        gold: {
          400: '#fbbf24',
          500: '#d97706',
          600: '#b45309',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

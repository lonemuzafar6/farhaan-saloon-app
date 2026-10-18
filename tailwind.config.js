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
          50: '#f6f7f8',
          100: '#edeef1',
          200: '#d7d9df',
          300: '#b4b8c3',
          400: '#8b91a2',
          500: '#6d7486',
          600: '#575c6d',
          700: '#474b59',
          800: '#2b2e37',
          900: '#1a1c23',
          950: '#111217',
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

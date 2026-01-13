/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Dynamic color classes used in the dashboard
    {
      pattern: /bg-(violet|blue|emerald|amber|red|purple|gray)-(50|100|200|500|600|700)/,
    },
    {
      pattern: /text-(violet|blue|emerald|amber|red|purple|gray)-(500|600|700)/,
    },
    {
      pattern: /border-(violet|blue|emerald|amber|red|purple|gray)-(100|200|500)/,
    },
    {
      pattern: /ring-(violet|blue|emerald|amber)-(200|500)/,
    },
    {
      pattern: /shadow-(violet|blue|emerald|amber|purple)-(100|200|600)/,
    },
    {
      pattern: /from-(violet|blue|emerald|amber|purple)-(500|600)/,
    },
    {
      pattern: /to-(violet|blue|emerald|amber|purple)-(600|700)/,
    },
    {
      pattern: /hover:bg-(violet|blue|emerald|amber|red|purple|gray)-(50|100|700)/,
    },
    {
      pattern: /hover:border-(violet|blue|emerald|amber)-(200|300)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#09090b', // primary canvas
          900: '#111115', // cards & surfaces
          850: '#16161b', // elevated cards
          800: '#1d1d24', // borders & hover
          750: '#25252e',
          700: '#32323e',
        },
        sage: {
          50: '#f4fbf7',
          100: '#e6f7ef',
          200: '#cff0e0',
          300: '#a5e2c5',
          400: '#6ecea2',
          500: '#3eb482',
          600: '#2b9568',
          700: '#237654',
          800: '#1f5e44',
          900: '#1b4d3a',
          950: '#0a2a1f',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 35px -5px rgba(62, 180, 130, 0.15)',
        'inner-border': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
      }
    },
  },
  plugins: [],
}

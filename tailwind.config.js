// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'packet': 'packetMove 1s ease-in-out',
      },
      keyframes: {
        packetMove: {
          '0%': { transform: 'translateX(0) translateY(0)', opacity: 1 },
          '100%': { transform: 'translateX(100px) translateY(-50px)', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfbf6',
          100: '#f7f0e3',
          200: '#f1e4cd',
        },
        terracotta: {
          50: '#fdf2ed',
          100: '#f9dfd0',
          200: '#f0bd9d',
          300: '#e6a37c',
          400: '#dc8862',
          500: '#c96a44',
          600: '#b2583a',
          700: '#8f4530',
          800: '#6e3624',
        },
        ink: {
          600: '#5a4636',
          700: '#4a3728',
          800: '#3a2a1e',
          900: '#2a1d14',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Be Vietnam Pro"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 6px 20px -4px rgba(58, 42, 30, 0.18)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease both',
        'slide-down': 'slideDown 0.4s ease both',
      },
    },
  },
  plugins: [],
};

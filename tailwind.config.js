/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#F8F7FD',
          100: '#ECE9FB',
          200: '#D5CCFA',
          300: '#B8A9F5',
          400: '#9B86F0',
          500: '#7A62E8',
          600: '#5B3FE0',
          700: '#4A30C4',
          800: '#3A23A8',
          900: '#2A1880',
        },
        teal: {
          50:  '#E3FAF4',
          100: '#C0F4E8',
          200: '#87EDD4',
          300: '#47E2BE',
          400: '#14C7A8',
          500: '#0E9C82',
          600: '#0A7A66',
          700: '#075A4D',
        },
        ink: {
          50:  '#141420',
          100: '#1e1c30',
          200: '#2e2a44',
          400: '#7a7592',
          600: '#9e99b8',
          800: '#d8d4ea',
          900: '#ece8f8',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

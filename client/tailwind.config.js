/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: '#f8dfe8',
        rose: '#f6d9e7',
        mauve: '#7a3855',
        plum: '#5b2b45',
        cream: '#f8f3f0',
        charcoal: '#2b1d22',
      },
      boxShadow: {
        soft: '0 20px 50px rgba(90, 48, 74, 0.12)',
      },
    },
  },
  plugins: [],
};


/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070a12',
        panel: '#101521',
        line: '#243044',
        acid: '#9cff45',
        cyan: '#35d4ff',
        danger: '#ff5277',
      },
      boxShadow: {
        glow: '0 0 32px rgba(156, 255, 69, 0.18)',
      },
    },
  },
  plugins: [],
};

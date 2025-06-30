/** @type {import('tailwindcss').Config} */
const textShadow = require('tailwindcss-textshadow');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        marcellus: ['Marcellus', 'serif',
          'Merriweather', 'serif',
        ],
        roboto: ['Roboto', 'sans-serif'],
        leagueSpartan: ['League Spartan', 'sans-serif'],
      },
    },
  },
  plugins: [textShadow],
};


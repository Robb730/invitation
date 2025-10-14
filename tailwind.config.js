/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        beige: '#F7EEDC',
        cream: '#FCF9F4',
        olive: '#A5B68D',
        'olive-dark': '#7D8F69',
        charcoal: '#2C2C2C',
        grayish: '#4A4A4A',
      }
    },
  },
  plugins: [],
}


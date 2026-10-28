/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          darkGreen: '#163824',
          leafGreen: '#5A9A3B',
          limeGreen: '#8CC63F',
          yellow: '#FBC02D',
          orange: '#F59E0B',
          brown: '#8D5B34',
          cream: '#F7F4EB',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'Fredoka', 'system-ui', 'sans-serif'],
        fredoka: ['Fredoka', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}

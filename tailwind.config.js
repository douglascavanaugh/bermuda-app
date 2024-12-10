/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono-regular': ['var(--font-geist-mono-regular)'],
        'mono-medium': ['var(--font-geist-mono-medium)'],
        'mono-semibold': ['var(--font-geist-mono-semibold)'],
        'mono-bold': ['var(--font-geist-mono-bold)'],
        'mono-black': ['var(--font-geist-mono-black)'],
      },
    },
  },
  plugins: [],
}
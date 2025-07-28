/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/embed/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      height: {
        '128': '32rem', // h-[32rem] equivalent
      },
      maxWidth: {
        '80%': '80%', // max-w-[80%] equivalent
      },
    },
  },
  plugins: [],
}

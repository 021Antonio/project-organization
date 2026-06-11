/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
      },
      colors: {
        board: {
          bg: '#f0f4ff',
          border: '#c8d4ee',
          card: '#ffffff',
          'card-border': '#dce6f8',
          header: '#1a2540',
          muted: '#7a9acf',
          accent: '#5a80df',
          'accent-light': '#eaf0ff',
        },
      },
    },
  },
  plugins: [],
}

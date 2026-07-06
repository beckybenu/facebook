/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0b',
        paper: '#f4f1ea',
        ember: '#ff5c33',
        gold: '#ffb347',
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        terminal: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

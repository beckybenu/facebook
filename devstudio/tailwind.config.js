/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--bg) / <alpha-value>)',
        paper: 'rgb(var(--fg) / <alpha-value>)',
        ember: 'rgb(var(--accent) / <alpha-value>)',
        gold: 'rgb(var(--accent2) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        logo: ['"Orbitron"', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

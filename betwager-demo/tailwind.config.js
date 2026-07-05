/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070B14",
        surface: "#0C1322",
        card: "#111A2E",
        elevated: "#16213A",
        edge: "#1E2A44",
        accent: {
          DEFAULT: "#00E67F",
          dark: "#00B463",
          soft: "rgba(0, 230, 127, 0.12)",
        },
        violet: {
          DEFAULT: "#8B5CF6",
          soft: "rgba(139, 92, 246, 0.14)",
        },
        gold: "#F5B93D",
        danger: "#F4526A",
        muted: "#8B99B8",
      },
      boxShadow: {
        glow: "0 0 24px rgba(0, 230, 127, 0.25)",
        card: "0 8px 30px rgba(2, 6, 16, 0.45)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 20% 20%, rgba(0,230,127,0.10), transparent 40%), radial-gradient(circle at 80% 10%, rgba(139,92,246,0.12), transparent 45%)",
      },
    },
  },
  plugins: [],
};

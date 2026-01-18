import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          red: "#DC2626",      // Primary red
          darkred: "#991B1B",  // Darker red for hover
          black: "#0A0A0A",    // Deep black
          gray: "#1F1F1F",     // Dark gray
        },
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "wa-green": "#25D366",
        "wa-dark": "#128C7E",
        "wa-light": "#DCF8C6",
        surface: "#F9FAFB",
        sidebar: "#0F1923",
        "border-brand": "#D1D5DB",
        danger: "#EF4444",
        success: "#10B981",
        warning: "#F59E0B",
        info: "#3B82F6",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,0.08)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

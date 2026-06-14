import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: "var(--brand)",
        "brand-dark": "var(--brand-dark)",
        "brand-light": "var(--brand-light)",
        border: "var(--border)",
        muted: "var(--muted)",
        "muted-fg": "var(--muted-fg)",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        'ritual': {
          'bg': '#050505',
          'surface': '#111111',
          'elevated': '#161616',
          'primary': '#40FFAF',
          'primary-hover': '#2EF19C',
          'border': '#222222',
        },
      },
    },
  },
  plugins: [],
};
export default config;

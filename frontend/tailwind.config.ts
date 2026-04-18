import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          surface: '#ffffff',
          ink: '#465253',
          'ink-soft': '#5a676a',
          'ink-muted': '#8a9497',
          line: '#e3e7e8',
          'line-soft': '#f1f3f4',
          accent: '#4ec3f1',
          'accent-hover': '#3cb5e6',
          'accent-soft': '#e7f6fd',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(70, 82, 83, 0.04), 0 1px 3px rgba(70, 82, 83, 0.08)',
        float: '0 4px 12px rgba(70, 82, 83, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;

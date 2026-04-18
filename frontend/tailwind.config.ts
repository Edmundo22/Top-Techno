import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          surface: '#ffffff',
          ink: '#1F2937',
          'ink-soft': '#000000',
          'ink-muted': '#000000',
          line: '#e3e7e8',
          'line-soft': '#f1f3f4',
          accent: '#b4e7ff',
          'accent-hover': '#8fd5f5',
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
        card: '0 1px 2px rgba(31, 41, 55, 0.04), 0 1px 3px rgba(31, 41, 55, 0.08)',
        float: '0 4px 12px rgba(31, 41, 55, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;

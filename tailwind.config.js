/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: '#0a0a0f',
        surface: '#111118',
        border: '#1e1e2e',
        accent: '#7c3aed',
        'accent-light': '#a78bfa',
        gold: '#f59e0b',
        silver: '#94a3b8',
        bronze: '#b45309',
        'gold-glow': '#fbbf24',
      },
      boxShadow: {
        gold: '0 0 20px rgba(245, 158, 11, 0.4)',
        silver: '0 0 20px rgba(148, 163, 184, 0.3)',
        bronze: '0 0 20px rgba(180, 83, 9, 0.4)',
        accent: '0 0 30px rgba(124, 58, 237, 0.5)',
      },
    },
  },
  plugins: [],
}

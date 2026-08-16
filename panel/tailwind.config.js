/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0b1220',
        base: '#0f172a',
        surface: '#1e293b',
        raised: '#263449',
        accent: '#22d3ee',
        warn: '#fbbf24',
        danger: '#f43f5e',
        ok: '#34d399',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

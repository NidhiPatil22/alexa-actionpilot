/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#070A12',
          900: '#0B0F19',
          850: '#111827',
          800: '#1A2234',
          700: '#28334E',
          600: '#3D4C70'
        },
        alexa: {
          violet: '#7C3AED',
          purple: '#8B5CF6',
          indigo: '#6366F1',
          cyan: '#06B6D4',
          glow: 'rgba(124, 58, 237, 0.35)',
          cyanglow: 'rgba(6, 182, 212, 0.35)'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        'glow-violet': '0 0 25px -5px rgba(124, 58, 237, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}

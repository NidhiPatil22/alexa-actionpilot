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
          950: '#05030A',
          900: '#0B0614',
          850: '#12081F',
          800: '#1A0F2E',
          750: '#23153C',
          700: '#2E1C4E',
          600: '#432B6E'
        },
        alexa: {
          violet: '#7C3AED',
          purple: '#8B5CF6',
          indigo: '#6366F1',
          magenta: '#D946EF',
          fuchsia: '#C026D3',
          pink: '#F43F5E',
          cyan: '#06B6D4',
          glow: 'rgba(139, 92, 246, 0.4)',
          magentaglow: 'rgba(217, 70, 239, 0.35)'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        'glow-violet': '0 0 25px -4px rgba(124, 58, 237, 0.45)',
        'glow-purple': '0 0 35px -5px rgba(139, 92, 246, 0.45)',
        'glow-magenta': '0 0 35px -5px rgba(217, 70, 239, 0.45)',
        'glow-orb': '0 0 70px 15px rgba(147, 51, 234, 0.35), inset 0 0 40px 10px rgba(217, 70, 239, 0.25)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.35)',
        'glass': '0 12px 40px 0 rgba(0, 0, 0, 0.65)'
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orb-breathe': 'orbBreathe 6s ease-in-out infinite',
        'ring-expand': 'ringExpand 3s ease-out infinite',
        'spin-slow': 'spin 12s linear infinite'
      },
      keyframes: {
        orbBreathe: {
          '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.04)', filter: 'brightness(1.15)' }
        },
        ringExpand: {
          '0%': { transform: 'scale(0.85)', opacity: '0.8' },
          '100%': { transform: 'scale(1.35)', opacity: '0' }
        }
      }
    },
  },
  plugins: [],
}

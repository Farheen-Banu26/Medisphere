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
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#22C55E',
          600: '#16a34a',
          700: '#15803d',
        },
        accent: {
          400: '#2dd4bf',
          500: '#14B8A6',
          600: '#0d9488',
        },
        // Named theme tokens
        background: '#0B1120',
        surface:    '#111827',
        'surface-2':'#1F2937',
        border:     '#1F2937',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card':     '0 1px 3px 0 rgba(0,0,0,0.4)',
        'card-md':  '0 4px 12px rgba(0,0,0,0.5)',
        'card-lg':  '0 8px 32px rgba(0,0,0,0.6)',
        'glow-blue':'0 0 20px rgba(59,130,246,0.35)',
        'glow-green':'0 0 20px rgba(34,197,94,0.35)',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-in-out',
        'slide-up':  'slideUp 0.3s ease-out',
        'pulse-slow':'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};

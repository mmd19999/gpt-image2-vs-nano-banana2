/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          0: '#07070B',
          1: '#0A0A0F',
          2: '#12121A',
          3: '#1A1A24',
        },
        gpt: {
          DEFAULT: '#8B5CF6',
          muted: '#6D4CC4',
          soft: '#A78BFA',
        },
        banana: {
          DEFAULT: '#06B6D4',
          muted: '#0891B2',
          soft: '#22D3EE',
        },
        win: '#10B981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(139, 92, 246, 0.25)',
        'glow-banana': '0 0 40px rgba(6, 182, 212, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface-deep': 'var(--color-bg-deep)',
        surface: 'var(--color-bg-surface)',
        'surface-card': 'var(--color-bg-card)',
        'surface-input': 'var(--color-bg-input)',
        'message-out': 'var(--color-bg-message-out)',
        'message-in': 'var(--color-bg-message-in)',
        'divider-subtle': 'var(--color-border)',
        'divider-soft': 'var(--color-border-soft)',
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        muted: 'var(--color-text-muted)',
        brand: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          dark: '#128C7E',
          light: '#25D366',
        },
      },
      fontFamily: {
        sans: ['Geist Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
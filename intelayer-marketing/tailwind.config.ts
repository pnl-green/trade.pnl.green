import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx,mdx,md}'],
  theme: {
    extend: {
      colors: {
        page: '#0B0E12',
        surface: '#0E131A',
        elev: '#0A1016',
        ink: '#E6F1FF',
        steel: '#A8B3C7',
        muted: '#7C8AA0',
        green: {
          50: '#E8FFF4',
          200: '#A6F3C7',
          400: '#3FE18F',
          500: '#15D380',
          600: '#10B873',
          700: '#0C9A60',
          900: '#043C28',
        },
        border: {
          DEFAULT: '#14202B',
        },
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.3)',
        md: '0 6px 16px rgba(0,0,0,0.35)',
        lg: '0 12px 28px rgba(0,0,0,0.45)',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
      },
      container: {
        center: true,
        padding: '1rem',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', '"Sora"', 'sans-serif'],
        body: ['"Inter"', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
} satisfies Config;

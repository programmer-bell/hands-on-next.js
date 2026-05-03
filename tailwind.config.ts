// tailwind.config.ts
// ─────────────────────────────────────────────────────────────
// Tailwind CSS configuration
// Aesthetic: industrial dark analytics dashboard
// Palette: navy backgrounds, electric cyan accent, semantic colors
// Fonts: Syne (headings), IBM Plex Mono (numbers), DM Sans (body)
// ─────────────────────────────────────────────────────────────

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-ibm-plex-mono)', 'Courier New', 'monospace'],
      },
      colors: {
        dash: {
          bg:       '#07080F',   // near-black navy base
          surface:  '#0D0F1C',   // card/panel surface
          elevated: '#131629',   // slightly raised surface
          border:   '#1E2235',   // subtle border
          muted:    '#252A40',   // muted/hover bg
          text:     '#E2E4F0',   // primary text
          subtle:   '#6B7280',   // secondary/muted text
          // Accent
          cyan:     '#00D4FF',   // electric cyan — primary accent
          'cyan-dim': '#0A4A5C', // dimmed cyan for backgrounds
          // Semantic
          success:  '#10B981',   // emerald — positive trend
          warning:  '#F59E0B',   // amber — caution
          danger:   '#F43F5E',   // rose — negative trend, errors
          purple:   '#7C3AED',   // secondary data series
        },
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-live': 'pulseLive 2s ease-in-out infinite',
        'count-up':   'countUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        pulseLive: { '0%, 100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.5', transform: 'scale(0.85)' } },
      },
    },
  },
  plugins: [],
};

export default config;

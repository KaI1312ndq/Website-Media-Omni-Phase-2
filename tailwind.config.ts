import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:   '#050F2C',
        navy2:  '#0A1A3E',
        blue:   '#2563EB',
        blue2:  '#1D4ED8',
        cyan:   '#06B6D4',
        paper:  '#F8FAFF',
        paper2: '#EEF4FF',
        ink:    '#0F172A',
        muted:  '#475569',
        faint:  '#94A3B8',
      },
      fontFamily: {
        display: ['var(--f-display)'],
        body:    ['var(--f-body)'],
        mono:    ['var(--f-mono)'],
      },
      borderRadius: {
        pill: '100px',
      },
    },
  },
  plugins: [],
}

export default config

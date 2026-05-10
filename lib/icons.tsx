import type { ReactElement } from 'react'

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export const Icon = {
  /* Quiz / Learning */
  quiz: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  /* Score / Bar Chart */
  score: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  /* Calendar (tasks view) */
  calendar: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  /* Plus (create) */
  plus: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  /* Book (read blog) */
  book: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  /* Edit (write blog) */
  edit: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  /* Send (publish) */
  send: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  /* Trash */
  trash: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
    </svg>
  ),
  /* Users (manage accounts) */
  users: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  /* Trending up (analytics) */
  trending: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  /* Zap (lightning, benchmark) */
  zap: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  /* Inbox (empty state) */
  inbox: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  /* Save (floppy) */
  save: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  /* Key (password) */
  key: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  ),
  /* Check (success) */
  check: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  /* Bar Chart 2 (alternate) */
  barChart: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="6" width="4" height="15" rx="1" />
      <rect x="17" y="9" width="4" height="12" rx="1" />
    </svg>
  ),
  /* Trophy */
  trophy: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  /* Flame (streak) */
  flame: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  /* Check Circle (success answer) */
  checkCircle: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  /* X Circle (wrong answer) */
  xCircle: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  ),
  /* Lightbulb (explanation) */
  bulb: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.8c1 .8 1 1.4 1 2.2v1h6v-1c0-.8 0-1.4 1-2.2A7 7 0 0 0 12 2Z" />
    </svg>
  ),
  /* Refresh / Retry */
  refresh: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),
  /* Clock (timer) */
  clock: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  /* Lock (fullscreen guard) */
  lock: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  /* Maximize (fullscreen toggle) */
  maximize: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  ),
  /* Arrow Left */
  arrowLeft: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  ),
  /* Arrow Right */
  arrowRight: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
  /* Book Open (study) */
  bookOpen: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  /* Mail */
  mail: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  /* Alert Triangle (warning) */
  alertTriangle: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  /* Ban (forbidden) */
  ban: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  ),
  /* Info (info callout) */
  info: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  /* Dot (priority) — filled */
  dot: (size = 18): ReactElement => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="6" />
    </svg>
  ),
  /* Wave (greeting) */
  wave: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M2 12c0-3.5 1.5-6 4-7" />
      <path d="M22 12c0-3.5-1.5-6-4-7" />
      <path d="M7 12V7a2 2 0 0 1 4 0v5" />
      <path d="M11 12V5a2 2 0 0 1 4 0v6" />
      <path d="M15 12V7a2 2 0 0 1 4 0v8a7 7 0 0 1-14 0v-3a2 2 0 0 1 4 0" />
    </svg>
  ),
}

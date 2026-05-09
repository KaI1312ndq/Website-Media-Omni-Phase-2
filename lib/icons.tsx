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
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  /* Score / Bar Chart */
  score: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  /* Calendar (tasks view) */
  calendar: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  /* Plus (create) */
  plus: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  /* Book (read blog) */
  book: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  ),
  /* Edit (write blog) */
  edit: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  /* Send (publish) */
  send: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  /* Trash */
  trash: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"/>
    </svg>
  ),
  /* Users (manage accounts) */
  users: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  /* Trending up (analytics) */
  trending: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  /* Zap (lightning, benchmark) */
  zap: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  /* Inbox (empty state) */
  inbox: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
    </svg>
  ),
  /* Save (floppy) */
  save: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  /* Key (password) */
  key: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <circle cx="7.5" cy="15.5" r="5.5"/>
      <path d="m21 2-9.6 9.6"/>
      <path d="m15.5 7.5 3 3L22 7l-3-3"/>
    </svg>
  ),
  /* Check (success) */
  check: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  /* Bar Chart 2 (alternate) */
  barChart: (size = 18): ReactElement => (
    <svg {...base} width={size} height={size}>
      <rect x="3" y="12" width="4" height="9" rx="1"/>
      <rect x="10" y="6" width="4" height="15" rx="1"/>
      <rect x="17" y="9" width="4" height="12" rx="1"/>
    </svg>
  ),
}

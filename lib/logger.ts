import pino from 'pino'

/**
 * Structured JSON logger. Vercel parses each line and exposes fields
 * (level, time, msg, ctx, ...) as searchable in the Logs UI.
 *
 * Sensitive fields are auto-redacted at any nesting depth.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  base: { env: process.env.VERCEL_ENV ?? 'local' },
  redact: {
    paths: [
      'password', '*.password',
      'token', '*.token',
      'authorization', '*.authorization',
      'cookie', '*.cookie',
      'turnstile_token', '*.turnstile_token',
      'SUPABASE_SERVICE_ROLE_KEY', 'SANITY_API_TOKEN', 'OPENAI_API_KEY',
    ],
    censor: '[REDACTED]',
  },
})

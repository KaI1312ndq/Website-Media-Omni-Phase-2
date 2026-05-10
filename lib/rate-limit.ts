/**
 * In-memory per-key rate limit. Resets on cold-start (Vercel serverless).
 * Suitable for low-traffic abuse prevention; upgrade to Upstash/Redis if needed.
 */
type Bucket = { count: number; resetAt: number }

const stores: Map<string, Map<string, Bucket>> = (() => {
  const g = globalThis as unknown as { __rateStores?: Map<string, Map<string, Bucket>> }
  if (!g.__rateStores) g.__rateStores = new Map()
  return g.__rateStores
})()

function getStore(name: string): Map<string, Bucket> {
  let s = stores.get(name)
  if (!s) { s = new Map(); stores.set(name, s) }
  return s
}

/**
 * Check + record a request. Returns true if allowed, false if rate-limited.
 * @param scope  Logical bucket (e.g. 'leads', 'auth-login')
 * @param key    Identifier within scope (usually IP)
 * @param max    Max requests in window
 * @param windowMs  Window length in ms
 */
export function checkRateLimit(scope: string, key: string, max: number, windowMs: number): boolean {
  const store = getStore(scope)
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

/** Best-effort client IP from common Vercel/proxy headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

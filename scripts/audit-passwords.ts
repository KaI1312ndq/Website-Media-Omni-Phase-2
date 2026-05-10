/**
 * Audit Supabase users for legacy plain-text passwords.
 *
 * Usage:
 *   npm run audit:passwords
 *
 * Prints a list of usernames that still have non-bcrypt passwords. Does NOT
 * re-hash anything — re-hashing a plain text turns it into a hashed-of-hash
 * which silently breaks the actual user's login. The admin must reset each
 * flagged user via /hub/users (which writes a fresh bcrypt).
 *
 * Once the list is empty, you can safely remove the plain-text fallback in
 * app/api/auth/route.ts and enforce bcrypt only.
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, name, role, status, password')

  if (error) {
    console.error('✗ Query failed:', error.message)
    process.exit(1)
  }

  const rows = data ?? []
  const legacy = rows.filter(u => {
    const p = String(u.password ?? '')
    return p.length > 0 && !(p.startsWith('$2a$') || p.startsWith('$2b$') || p.startsWith('$2y$'))
  })

  console.log(`\nScanned ${rows.length} user(s).`)
  console.log(`Legacy (plain-text) passwords: ${legacy.length}\n`)

  if (legacy.length === 0) {
    console.log('✓ All users are on bcrypt. Safe to remove the plain-text fallback in app/api/auth/route.ts.')
    return
  }

  console.log('Username        | Name                 | Role     | Status')
  console.log('-'.repeat(72))
  for (const u of legacy) {
    console.log(
      `${String(u.username).padEnd(15)} | ${String(u.name ?? '').padEnd(20)} | ${String(u.role ?? '').padEnd(8)} | ${u.status}`
    )
  }
  console.log('\n→ Reset each user above via /hub/users. The form re-hashes with bcrypt automatically.')
  console.log('→ Re-run this script after resets to confirm zero remain, then remove the legacy branch.')
}

main().catch(e => { console.error(e); process.exit(1) })

/**
 * Apply Supabase SQL migrations in order.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/migrate.ts
 *
 * Requires `psql` available on PATH. Migrations run in filename order.
 * Files live in scripts/migrations/*.sql.
 *
 * If you prefer the Supabase Dashboard, just open each file and paste it
 * into the SQL Editor in order.
 */
import { execSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('✗ DATABASE_URL is required.')
  console.error('  Get it from Supabase → Project Settings → Database → Connection string (URI).')
  process.exit(1)
}

const dir = join(process.cwd(), 'scripts/migrations')
const files = readdirSync(dir).filter(f => f.endsWith('.sql')).sort()

if (files.length === 0) {
  console.log('No migrations found in scripts/migrations/.')
  process.exit(0)
}

console.log(`Applying ${files.length} migration(s) from scripts/migrations/:\n`)
for (const f of files) {
  console.log(`→ ${f}`)
  try {
    execSync(`psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${join(dir, f)}"`, { stdio: 'inherit' })
  } catch {
    console.error(`✗ Failed at ${f}`)
    process.exit(1)
  }
}
console.log('\n✓ All migrations applied.')

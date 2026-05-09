import { cookies } from 'next/headers'
import type { SessionUser } from './auth'

/* Read mo_session httpOnly cookie on the server. Returns null if missing/invalid. */
export async function getSessionFromCookie(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const c = store.get('mo_session')
    if (!c) return null
    return JSON.parse(c.value) as SessionUser
  } catch {
    return null
  }
}

/* assigned_members is a STRING in DB ("all" or "user1,user2,..."). */
export function isAssignedTo(assigned: string | null | undefined, username: string): boolean {
  if (!assigned) return false
  const trimmed = assigned.trim()
  if (trimmed === 'all') return true
  return trimmed.split(',').map(s => s.trim()).includes(username)
}

/* Returns true if session can see all brands (admin/lead). */
export function canSeeAllBrands(session: SessionUser | null): boolean {
  if (!session) return false
  const role = String(session.role || '').toLowerCase()
  return role === 'admin' || role === 'lead'
}

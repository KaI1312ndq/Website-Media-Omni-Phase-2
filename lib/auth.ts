export type UserRole = 'admin' | 'member' | 'upbase'

export interface SessionUser {
  id: string
  username: string
  name: string
  role: UserRole
  perms: Record<string, number>
  avatar_url?: string | null
}

export const ROLE_DEFAULTS: Record<UserRole, Record<string, number>> = {
  admin:  { quiz_view:1, quiz_score:1, tasks_view:1, tasks_create:1, blog_view:1, blog_write:1, blog_publish:1, blog_delete:1, admin_users:1, admin_scores:1 },
  member: { quiz_view:1, quiz_score:0, tasks_view:1, tasks_create:0, blog_view:1, blog_write:1, blog_publish:1, blog_delete:0, admin_users:0, admin_scores:0 },
  upbase: { quiz_view:1, quiz_score:0, tasks_view:0, tasks_create:0, blog_view:0, blog_write:0, blog_publish:0, blog_delete:0, admin_users:0, admin_scores:0 },
}

export function getSession(): SessionUser | null {
  if (typeof window === 'undefined') return null
  try {
    const s = sessionStorage.getItem('mo_user') || localStorage.getItem('mo_user')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export function setSession(user: SessionUser) {
  const j = JSON.stringify(user)
  sessionStorage.setItem('mo_user', j)
  localStorage.setItem('mo_user', j)
}

export function clearSession() {
  sessionStorage.removeItem('mo_user')
  localStorage.removeItem('mo_user')
}

export function initials(name: string) {
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
}

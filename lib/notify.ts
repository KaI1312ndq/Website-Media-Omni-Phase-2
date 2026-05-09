import { supabaseAdmin } from './supabase'

interface NotifyArgs {
  recipient: string         // username
  type: string
  title: string
  body?: string
  link?: string
  icon?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export async function notify(args: NotifyArgs) {
  try {
    await supabaseAdmin.from('notifications').insert({
      recipient: args.recipient,
      type: args.type,
      title: args.title,
      body: args.body || null,
      link: args.link || null,
      icon: args.icon || null,
      priority: args.priority || 'normal',
    })
  } catch (e) {
    console.error('[notify] failed:', e)
  }
}

export async function notifyMany(recipients: string[], args: Omit<NotifyArgs, 'recipient'>) {
  if (!recipients.length) return
  const rows = recipients.map(r => ({
    recipient: r,
    type: args.type,
    title: args.title,
    body: args.body || null,
    link: args.link || null,
    icon: args.icon || null,
    priority: args.priority || 'normal',
  }))
  try {
    await supabaseAdmin.from('notifications').insert(rows)
  } catch (e) {
    console.error('[notifyMany] failed:', e)
  }
}

export async function notifyAdmins(args: Omit<NotifyArgs, 'recipient'>) {
  try {
    const { data } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('role', 'admin')
      .eq('status', 'active')
    await notifyMany((data || []).map((u: { username: string }) => u.username), args)
  } catch (e) {
    console.error('[notifyAdmins] failed:', e)
  }
}

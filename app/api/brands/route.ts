import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie, isAssignedTo, canSeeAllBrands } from '@/lib/session-server'
import { logger } from '@/lib/logger'

// ── Allowlist + sanitizer for editable fields ──
// All members can edit context — keep brand_name + assigned_members admin-only
// via action=update (legacy) to avoid accidental renames.
const CONTEXT_FIELDS = [
  'industry',
  'product_type',
  'target_audience',
  'price_range',
  'brand_stage',
  'monthly_budget',
  'roas_target',
  'seasonality',
  'live_schedule',
  'key_kpis',
  'notes',
] as const

function trim(v: unknown, max = 2000): string | null {
  if (typeof v !== 'string') return null
  const s = v.replace(/[<>]/g, '').trim()
  if (!s) return null
  return s.slice(0, max)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const usernameParam = searchParams.get('username') || ''
  const all = searchParams.get('all') === '1' // when true, ignore assignment filter
  const session = await getSessionFromCookie()

  const { data, error } = await supabaseAdmin
    .from('brands')
    .select('*')
    .eq('active', true)
    .order('brand_name')
  if (error) {
    logger.error({ err: error, ctx: 'GET /api/brands' }, 'fetch brands failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data || []

  // Server-side permission. Session > query param. `all=1` bypasses filter
  // (used by /hub/brands so any logged-in member can see+edit context).
  let filtered = rows
  if (!all) {
    if (session) {
      if (!canSeeAllBrands(session)) {
        filtered = rows.filter(b => isAssignedTo(b.assigned_members, session.username))
      }
    } else if (usernameParam) {
      filtered = rows.filter(b => isAssignedTo(b.assigned_members, usernameParam))
    }
  }

  return NextResponse.json({ data: filtered })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookie()
  const body = await req.json()
  const { action, id, ...fields } = body

  const normalizeAssigned = (v: unknown): string => {
    if (Array.isArray(v)) return v.join(',')
    if (typeof v === 'string') return v.trim() || 'all'
    return 'all'
  }

  if (action === 'create') {
    const { error } = await supabaseAdmin.from('brands').insert([
      {
        brand_name: fields.brand_name,
        assigned_members: normalizeAssigned(fields.assigned_members),
      },
    ])
    if (error) {
      logger.error({ err: error, ctx: 'POST /api/brands create' }, 'create brand failed')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'update') {
    // Legacy: rename + assignment (admin only — kept restrictive)
    const { error } = await supabaseAdmin
      .from('brands')
      .update({
        brand_name: fields.brand_name,
        assigned_members: normalizeAssigned(fields.assigned_members),
        active: fields.active,
      })
      .eq('id', id)
    if (error) {
      logger.error({ err: error, ctx: 'POST /api/brands update' }, 'update brand failed')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

/* ── PATCH /api/brands — edit brand CONTEXT only (any logged-in member) ── */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Whitelist fields user can update
  const update: Record<string, unknown> = {
    updated_by: session.username,
    updated_at: new Date().toISOString(),
  }
  for (const k of CONTEXT_FIELDS) {
    if (k in body) update[k] = trim(body[k])
  }

  const { error } = await supabaseAdmin.from('brands').update(update).eq('id', id)
  if (error) {
    logger.error({ err: error, ctx: 'PATCH /api/brands' }, 'patch brand context failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

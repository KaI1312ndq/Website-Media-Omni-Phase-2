import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')
  const store = searchParams.get('store')

  let query = supabaseAdmin
    .from('weekly_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (username) query = query.eq('username', username)
  if (store) query = query.eq('store', store)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'analyze') {
    // Call Claude API for AI analysis
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Fallback: return raw formatted data
      return NextResponse.json({ analysis: buildFallbackReport(body) })
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: buildPrompt(body),
          }],
        }),
      })
      const j = await res.json()
      const analysis = j.content?.[0]?.text || buildFallbackReport(body)
      return NextResponse.json({ analysis })
    } catch {
      return NextResponse.json({ analysis: buildFallbackReport(body) })
    }
  }

  if (action === 'save') {
    const { username, store, platform, week_label, week_start, week_end, shopee_data, tiktok_data, ai_analysis } = body
    const { error } = await supabaseAdmin.from('weekly_reports').insert({
      username,
      store,
      platform,
      week_label,
      week_start,
      week_end,
      shopee_data,
      tiktok_data,
      ai_analysis,
      created_at: new Date().toISOString(),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

/* ── Helpers ── */
function fmt(v: unknown, unit = ''): string {
  const n = parseFloat(String(v || 0))
  if (isNaN(n) || n === 0) return '—'
  if (unit === '₫') return n.toLocaleString('vi-VN') + '₫'
  if (unit === 'x') return n + 'x'
  if (unit === '%') return n + '%'
  return n.toLocaleString('vi-VN')
}

function buildFallbackReport(body: Record<string, unknown>): string {
  const { weekInfo, store, platform, shopee, tiktok } = body as {
    weekInfo: { label: string; start: string; end: string; days: number }
    store: string; platform: string
    shopee: Record<string, unknown>; tiktok: Record<string, unknown>
  }

  const lines: string[] = [
    `📊 BÁO CÁO HIỆU QUẢ QUẢNG CÁO — ${weekInfo?.label || ''}`,
    `📅 Kỳ: ${weekInfo?.start} – ${weekInfo?.end} (${weekInfo?.days} ngày)`,
    store ? `🏪 Store: ${store}` : '',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ]

  if (platform === 'shopee' || platform === 'both') {
    lines.push('', '🛒 SHOPEE ADS', '─────────────')
    lines.push(`• Doanh số: ${fmt(shopee?.doanh_so, '₫')}`)
    lines.push(`• Chi phí: ${fmt(shopee?.chi_phi, '₫')}`)
    lines.push(`• ROAS: ${fmt(shopee?.roas, 'x')}`)
    lines.push(`• CPC: ${fmt(shopee?.cpc, '₫')}`)
    lines.push(`• CTR: ${fmt(shopee?.ctr, '%')}`)
    lines.push(`• CR: ${fmt(shopee?.cr, '%')}`)
    lines.push(`• Đơn hàng: ${fmt(shopee?.don_hang)}`)
    lines.push(`• Lượt xem: ${fmt(shopee?.luot_xem)}`)
  }

  if (platform === 'tiktok' || platform === 'both') {
    lines.push('', '🎵 TIKTOK ADS', '─────────────')
    lines.push(`• Doanh số: ${fmt(tiktok?.doanh_so, '₫')}`)
    lines.push(`• Chi phí: ${fmt(tiktok?.chi_phi, '₫')}`)
    lines.push(`• ROAS: ${fmt(tiktok?.roas, 'x')}`)
    lines.push(`• CPC: ${fmt(tiktok?.cpc, '₫')}`)
    lines.push(`• CTR: ${fmt(tiktok?.ctr, '%')}`)
    lines.push(`• CR: ${fmt(tiktok?.cr, '%')}`)
    lines.push(`• Đơn hàng: ${fmt(tiktok?.don_hang)}`)
    lines.push(`• Lượt xem: ${fmt(tiktok?.luot_xem)}`)
  }

  lines.push('', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('📝 Ghi chú: [Thêm nhận xét tại đây]')
  lines.push('', 'Media Omni Team')

  return lines.filter(l => l !== null).join('\n')
}

function buildPrompt(body: Record<string, unknown>): string {
  const { weekInfo, platform, shopee, tiktok } = body as {
    weekInfo: { label: string; start: string; end: string; days: number }
    platform: string
    shopee: Record<string, unknown>; tiktok: Record<string, unknown>
  }

  return `Bạn là chuyên gia phân tích performance marketing ecommerce tại Việt Nam (TikTok Shop, Shopee).

Hãy viết báo cáo tuần ngắn gọn, chuyên nghiệp bằng tiếng Việt để gửi qua Lark mail cho client/manager. Format rõ ràng, có emoji, dùng bullet points.

DỮ LIỆU TUẦN ${weekInfo?.label} (${weekInfo?.start} – ${weekInfo?.end}, ${weekInfo?.days} ngày):

${platform === 'shopee' || platform === 'both' ? `SHOPEE:
- Doanh số: ${shopee?.doanh_so || 0}₫
- Chi phí: ${shopee?.chi_phi || 0}₫
- ROAS: ${shopee?.roas}x
- Lượt xem: ${shopee?.luot_xem}
- Lượt click: ${shopee?.luot_click}
- CTR: ${shopee?.ctr}%
- CPC: ${shopee?.cpc}₫
- Đơn hàng: ${shopee?.don_hang}
- CR: ${shopee?.cr}%
- AOV: ${shopee?.aov}₫` : ''}

${platform === 'tiktok' || platform === 'both' ? `TIKTOK:
- Doanh số: ${tiktok?.doanh_so || 0}₫
- Chi phí: ${tiktok?.chi_phi || 0}₫
- ROAS: ${tiktok?.roas}x
- Lượt xem: ${tiktok?.luot_xem}
- Lượt click: ${tiktok?.luot_click}
- CTR: ${tiktok?.ctr}%
- CPC: ${tiktok?.cpc}₫
- Đơn hàng: ${tiktok?.don_hang}
- CR: ${tiktok?.cr}%
- AOV: ${tiktok?.aov}₫` : ''}

Yêu cầu báo cáo:
1. Tiêu đề và thông tin kỳ báo cáo
2. Tóm tắt kết quả từng platform (nếu có)
3. Điểm nổi bật (tốt/cần cải thiện)
4. 2-3 đề xuất hành động tuần sau
5. Ký tên "Media Omni Team"

Viết tự nhiên, chuyên nghiệp, không quá dài (dưới 400 từ).`
}

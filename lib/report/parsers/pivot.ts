import type {
  HinhThuc,
  PivotRow,
  ShopeeAutoFill,
  ShopeePivot,
  ShopeeVerticalPivot,
  ShopeeVerticalRow,
} from './types'

/**
 * Build the final 9-row (or fewer) pivot table from 3 parser outputs.
 *
 * Order: CPC subrows → CPC Total → Branding subrows → Branding Total → Live subrows → Live Total → Tổng cộng.
 * Always emits a "Total" row per hình thức (even when only 1 sub-row), per Brief mục 5 rules.
 *
 * Derived metrics (ROAS / CPC / CPM / CTR / CR) are computed AFTER summing raw values.
 * NEVER averaged from sub-rows — per CRITICAL RULE in brief.
 */
export function buildShopeePivot(
  cpcRows: PivotRow[],
  brandingRows: PivotRow[],
  liveRows: PivotRow[],
): ShopeePivot {
  const subtotals = (allRows: PivotRow[], hinh_thuc: HinhThuc): PivotRow => {
    // Loại bỏ sub-cat rows (Thủ công / Tự động) khỏi subtotal — tránh double-count
    const rows = allRows.filter(r => !r.isSubcat)
    const gmv = rows.reduce((s, r) => s + r.gmv, 0)
    const cost = rows.reduce((s, r) => s + r.cost, 0)
    const hien_thi = rows.reduce((s, r) => s + r.hien_thi, 0)
    // clicks: if ANY row has null clicks (Live), keep null
    const anyNullClicks = rows.some(r => r.clicks === null)
    const clicks = anyNullClicks ? null : rows.reduce((s, r) => s + (r.clicks ?? 0), 0)
    const orders = rows.reduce((s, r) => s + r.orders, 0)
    return {
      hinh_thuc,
      loai_dvht: 'Total',
      isTotal: true,
      gmv,
      cost,
      hien_thi,
      clicks,
      orders,
      roas: 0,
      cpc: null,
      cpm: 0,
      ctr: null,
      cr: null,
      pct_gmv: 0,
      pct_cost: 0,
    }
  }

  // Assemble groups (sub-rows + their Total)
  const groups: PivotRow[][] = []
  if (cpcRows.length > 0) groups.push([...cpcRows, subtotals(cpcRows, 'Ads CPC')])
  if (brandingRows.length > 0) groups.push([...brandingRows, subtotals(brandingRows, 'Ads Branding')])
  if (liveRows.length > 0) groups.push([...liveRows, subtotals(liveRows, 'Ads Live')])

  // Grand total = sum of each hình thức's Total row.
  // Note: clicks is summed across hình thức treating null as 0 (Ads Live has no
  // clicks data — but the user wants a meaningful "tổng" line, so we still
  // compute clicks/CPC/CTR/CR from non-null platforms. The blended CPC etc.
  // will include Live cost in the numerator but only CPC+Branding clicks in
  // the denominator — slightly inflated, but matches user expectation of
  // "blended Shopee CPC across the week".
  const totalRows = groups.map(g => g[g.length - 1])
  const grandGmv = totalRows.reduce((s, r) => s + r.gmv, 0)
  const grandCost = totalRows.reduce((s, r) => s + r.cost, 0)
  const grandHienThi = totalRows.reduce((s, r) => s + r.hien_thi, 0)
  const grandClicks = totalRows.reduce((s, r) => s + (r.clicks ?? 0), 0)
  const grandOrders = totalRows.reduce((s, r) => s + r.orders, 0)

  const grandTotal: PivotRow = {
    hinh_thuc: '',
    loai_dvht: 'Tổng cộng',
    isTotal: true,
    isGrandTotal: true,
    gmv: grandGmv,
    cost: grandCost,
    hien_thi: grandHienThi,
    clicks: grandClicks,
    orders: grandOrders,
    roas: 0,
    cpc: null,
    cpm: 0,
    ctr: null,
    cr: null,
    pct_gmv: 100,
    pct_cost: 100,
  }

  // Flatten + grand total
  const flatRows: PivotRow[] = [...groups.flat(), grandTotal]

  // Compute derived metrics for ALL rows (after aggregation)
  for (const row of flatRows) {
    row.roas = row.cost > 0 ? +(row.gmv / row.cost).toFixed(2) : 0
    row.cpm = row.hien_thi > 0 ? +((row.cost / row.hien_thi) * 1000).toFixed(0) : 0
    if (row.clicks !== null && row.clicks > 0) {
      row.cpc = +(row.cost / row.clicks).toFixed(0)
      row.ctr = +((row.clicks / row.hien_thi) * 100).toFixed(2)
      row.cr = +((row.orders / row.clicks) * 100).toFixed(2)
    } else {
      row.cpc = null
      row.ctr = null
      row.cr = null
    }
    if (!row.isGrandTotal) {
      row.pct_gmv = grandGmv > 0 ? +((row.gmv / grandGmv) * 100).toFixed(2) : 0
      row.pct_cost = grandCost > 0 ? +((row.cost / grandCost) * 100).toFixed(2) : 0
    }
  }

  return {
    rows: flatRows,
    metadata: {
      cpc_present: cpcRows.length > 0,
      branding_present: brandingRows.length > 0,
      live_present: liveRows.length > 0,
    },
  }
}

/**
 * Map pivot → 12 Step 2 actual fields.
 * Uses the "Total" row of each hình thức (per Brief mục 6 Option X).
 * Missing platforms → fields = 0.
 */
export function pivotToAutoFill(pivot: ShopeePivot): ShopeeAutoFill {
  const cpcTotal = pivot.rows.find(r => r.hinh_thuc === 'Ads CPC' && r.isTotal && !r.isGrandTotal)
  const brandTotal = pivot.rows.find(r => r.hinh_thuc === 'Ads Branding' && r.isTotal && !r.isGrandTotal)
  const liveTotal = pivot.rows.find(r => r.hinh_thuc === 'Ads Live' && r.isTotal && !r.isGrandTotal)

  return {
    s_cpc_doanh_so: cpcTotal?.gmv ?? 0,
    s_cpc_chi_phi: cpcTotal?.cost ?? 0,
    s_cpc_luot_xem: cpcTotal?.hien_thi ?? 0,
    s_cpc_luot_click: cpcTotal?.clicks ?? 0,
    s_cpc_don_hang: cpcTotal?.orders ?? 0,
    s_nd_gmv: brandTotal?.gmv ?? 0,
    s_nd_chi_phi: brandTotal?.cost ?? 0,
    s_nd_luot_xem: brandTotal?.hien_thi ?? 0,
    s_nd_luot_click: brandTotal?.clicks ?? 0,
    s_live_gmv: liveTotal?.gmv ?? 0,
    s_live_chi_phi: liveTotal?.cost ?? 0,
    s_live_luot_xem: liveTotal?.hien_thi ?? 0,
  }
}

/**
 * Transform the horizontal ShopeePivot into a vertical pivot grouped by
 * 4 hình thức (Ads tổng / Ads CPC / Ads nhận diện thương hiệu / Ads livestream).
 *
 * Always emits all 4 groups so layout is stable. Missing platforms → value=null.
 *
 * - Ads tổng (5 metrics): pulled from the grand total row of the horizontal pivot.
 * - Ads CPC (10 metrics): pulled from "Ads CPC Total" sub-row + AOV computed.
 * - Ads nhận diện thương hiệu (7 metrics): pulled from "Ads Branding Total".
 * - Ads livestream (4 metrics): pulled from "Ads Live Total".
 */
export function toShopeeVerticalPivot(pivot: ShopeePivot): ShopeeVerticalPivot {
  const cpcTotal = pivot.rows.find(r => r.hinh_thuc === 'Ads CPC' && r.isTotal && !r.isGrandTotal)
  const ndTotal = pivot.rows.find(r => r.hinh_thuc === 'Ads Branding' && r.isTotal && !r.isGrandTotal)
  const liveTotal = pivot.rows.find(r => r.hinh_thuc === 'Ads Live' && r.isTotal && !r.isGrandTotal)
  const grand = pivot.rows.find(r => r.isGrandTotal)

  const rows: ShopeeVerticalRow[] = []

  // ── Ads tổng (5) ──
  rows.push(
    {
      hinh_thuc: 'Ads tổng',
      metric: 'Doanh thu Ads (GMV)',
      value: grand?.gmv ?? null,
      format: 'integer',
      isBold: true,
    },
    {
      hinh_thuc: 'Ads tổng',
      metric: 'Chi phí ads',
      value: grand?.cost ?? null,
      format: 'integer',
      isBold: true,
    },
    {
      hinh_thuc: 'Ads tổng',
      metric: 'ROAS ads',
      value: grand?.roas ?? null,
      format: 'decimal',
      isBold: true,
    },
    {
      hinh_thuc: 'Ads tổng',
      metric: 'Số lượt clicks',
      value: grand?.clicks ?? null,
      format: 'integer',
      isBold: true,
    },
    {
      hinh_thuc: 'Ads tổng',
      metric: 'Số lượt xem ads',
      value: grand?.hien_thi ?? null,
      format: 'integer',
      isBold: true,
    },
  )

  // ── Ads CPC (10) ──
  const cpcAov = cpcTotal && cpcTotal.orders > 0 ? +(cpcTotal.gmv / cpcTotal.orders).toFixed(0) : null
  rows.push(
    {
      hinh_thuc: 'Ads CPC',
      metric: 'Doanh số Ads',
      value: cpcTotal?.gmv ?? null,
      format: 'integer',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads CPC',
      metric: 'Chi Phí Dịch vụ hiển thị',
      value: cpcTotal?.cost ?? null,
      format: 'integer',
      isBold: false,
    },
    { hinh_thuc: 'Ads CPC', metric: 'ROAS', value: cpcTotal?.roas ?? null, format: 'decimal', isBold: false },
    {
      hinh_thuc: 'Ads CPC',
      metric: 'CPC = Chi phí / Lượt click',
      value: cpcTotal?.cpc ?? null,
      format: 'integer',
      isBold: false,
    },
    { hinh_thuc: 'Ads CPC', metric: 'CTR', value: cpcTotal?.ctr ?? null, format: 'percent', isBold: false },
    {
      hinh_thuc: 'Ads CPC',
      metric: 'CR = Đơn hàng / Lượt click*100 (%)',
      value: cpcTotal?.cr ?? null,
      format: 'percent',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads CPC',
      metric: 'Số lượt xem',
      value: cpcTotal?.hien_thi ?? null,
      format: 'integer',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads CPC',
      metric: 'Số lượt click',
      value: cpcTotal?.clicks ?? null,
      format: 'integer',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads CPC',
      metric: 'Số đơn hàng',
      value: cpcTotal?.orders ?? null,
      format: 'integer',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads CPC',
      metric: 'AOV = Doanh thu / Số đơn hàng',
      value: cpcAov,
      format: 'integer',
      isBold: false,
    },
  )

  // ── Ads nhận diện thương hiệu (7) ──
  rows.push(
    {
      hinh_thuc: 'Ads nhận diện thương hiệu',
      metric: 'Doanh thu Ads (GMV)',
      value: ndTotal?.gmv ?? null,
      format: 'integer',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads nhận diện thương hiệu',
      metric: 'Chi phí ads',
      value: ndTotal?.cost ?? null,
      format: 'integer',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads nhận diện thương hiệu',
      metric: 'ROAS ads',
      value: ndTotal?.roas ?? null,
      format: 'decimal',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads nhận diện thương hiệu',
      metric: 'CPC = Chi phí / Lượt click',
      value: ndTotal?.cpc ?? null,
      format: 'integer',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads nhận diện thương hiệu',
      metric: 'CTR',
      value: ndTotal?.ctr ?? null,
      format: 'percent',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads nhận diện thương hiệu',
      metric: 'Số lượt xem',
      value: ndTotal?.hien_thi ?? null,
      format: 'integer',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads nhận diện thương hiệu',
      metric: 'Số lượt click',
      value: ndTotal?.clicks ?? null,
      format: 'integer',
      isBold: false,
    },
  )

  // ── Ads livestream (4) ──
  rows.push(
    {
      hinh_thuc: 'Ads livestream',
      metric: 'Doanh thu Ads (GMV)',
      value: liveTotal?.gmv ?? null,
      format: 'integer',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads livestream',
      metric: 'Chi phí ads',
      value: liveTotal?.cost ?? null,
      format: 'integer',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads livestream',
      metric: 'ROAS ads',
      value: liveTotal?.roas ?? null,
      format: 'decimal',
      isBold: false,
    },
    {
      hinh_thuc: 'Ads livestream',
      metric: 'Lượt xem',
      value: liveTotal?.hien_thi ?? null,
      format: 'integer',
      isBold: false,
    },
  )

  return { rows }
}

import type { TiktokAutoFill, TiktokLGMData, TiktokPGMData, TiktokPivot, TiktokPivotRow } from './types'

/**
 * Build TikTok pivot (vertical layout per Brief V9.2 §5).
 *
 * Order is CỨNG: Ads_Total → Ads_PGM → Ads_LGM → Consideration_Ads → Branding_Ads
 *
 * Ads_Total = PGM + LGM ONLY (does NOT include Consideration/Branding — Q6).
 * Consideration_Ads + Branding_Ads always render "—" (user fills in Step 2).
 *
 * Derived metrics computed AFTER aggregation. Divide-by-zero → null → "—".
 */
export function buildTiktokPivot(pgm: TiktokPGMData | null, lgm: TiktokLGMData | null): TiktokPivot {
  const _pgm = pgm ?? { gmv: 0, cost: 0, hien_thi: 0, clicks: 0, orders: 0 }
  const _lgm = lgm ?? { gmv: 0, cost: 0 }

  // === PGM derived ===
  const pgm_roas = _pgm.cost > 0 ? +(_pgm.gmv / _pgm.cost).toFixed(2) : null
  const pgm_cpc = _pgm.clicks > 0 ? +(_pgm.cost / _pgm.clicks).toFixed(0) : null
  const pgm_cpm = _pgm.hien_thi > 0 ? +((_pgm.cost / _pgm.hien_thi) * 1000).toFixed(0) : null
  const pgm_ctr = _pgm.hien_thi > 0 ? +((_pgm.clicks / _pgm.hien_thi) * 100).toFixed(2) : null
  const pgm_cr = _pgm.clicks > 0 ? +((_pgm.orders / _pgm.clicks) * 100).toFixed(2) : null
  const pgm_aov = _pgm.orders > 0 ? +(_pgm.gmv / _pgm.orders).toFixed(0) : null

  // === LGM derived ===
  const lgm_roi = _lgm.cost > 0 ? +(_lgm.gmv / _lgm.cost).toFixed(2) : null

  // === Ads_Total === (PGM + LGM only)
  const total_gmv = _pgm.gmv + _lgm.gmv
  const total_cost = _pgm.cost + _lgm.cost
  const total_roi = total_cost > 0 ? +(total_gmv / total_cost).toFixed(2) : null

  const rows: TiktokPivotRow[] = [
    // Ads_Total — bold
    { hinh_thuc: 'Ads_Total', metric: 'Doanh thu Ads', value: total_gmv, format: 'integer', isBold: true },
    { hinh_thuc: 'Ads_Total', metric: 'Chi phí Ads', value: total_cost, format: 'integer', isBold: true },
    { hinh_thuc: 'Ads_Total', metric: 'ROI', value: total_roi, format: 'decimal', isBold: true },

    // Ads_PGM
    { hinh_thuc: 'Ads_PGM', metric: 'Doanh thu PGM', value: _pgm.gmv, format: 'integer', isBold: false },
    { hinh_thuc: 'Ads_PGM', metric: 'Chi phí PGM', value: _pgm.cost, format: 'integer', isBold: false },
    { hinh_thuc: 'Ads_PGM', metric: 'ROAS', value: pgm_roas, format: 'decimal', isBold: false },
    { hinh_thuc: 'Ads_PGM', metric: 'CPC', value: pgm_cpc, format: 'integer', isBold: false },
    { hinh_thuc: 'Ads_PGM', metric: 'CTR', value: pgm_ctr, format: 'percent', isBold: false },
    { hinh_thuc: 'Ads_PGM', metric: 'CR', value: pgm_cr, format: 'percent', isBold: false },
    { hinh_thuc: 'Ads_PGM', metric: 'CPM', value: pgm_cpm, format: 'integer', isBold: false },
    { hinh_thuc: 'Ads_PGM', metric: 'Số lượt xem', value: _pgm.hien_thi, format: 'integer', isBold: false },
    { hinh_thuc: 'Ads_PGM', metric: 'Số lượt click', value: _pgm.clicks, format: 'integer', isBold: false },
    { hinh_thuc: 'Ads_PGM', metric: 'Số đơn hàng', value: _pgm.orders, format: 'integer', isBold: false },
    { hinh_thuc: 'Ads_PGM', metric: 'AOV', value: pgm_aov, format: 'integer', isBold: false },

    // Ads_LGM
    { hinh_thuc: 'Ads_LGM', metric: 'Doanh thu LGM', value: _lgm.gmv, format: 'integer', isBold: false },
    { hinh_thuc: 'Ads_LGM', metric: 'Chi phí LGM', value: _lgm.cost, format: 'integer', isBold: false },
    { hinh_thuc: 'Ads_LGM', metric: 'ROI', value: lgm_roi, format: 'decimal', isBold: false },

    // Consideration_Ads — always null (user enters in Step 2)
    {
      hinh_thuc: 'Consideration_Ads',
      metric: 'Consider (Số người nhận biết thương hiệu)',
      value: null,
      format: 'integer',
      isBold: false,
    },
    {
      hinh_thuc: 'Consideration_Ads',
      metric: 'Chi phí C-Ads',
      value: null,
      format: 'integer',
      isBold: false,
    },
    { hinh_thuc: 'Consideration_Ads', metric: 'CPA', value: null, format: 'integer', isBold: false },

    // Branding_Ads — always null
    { hinh_thuc: 'Branding_Ads', metric: 'View', value: null, format: 'integer', isBold: false },
    { hinh_thuc: 'Branding_Ads', metric: 'Follow', value: null, format: 'integer', isBold: false },
    {
      hinh_thuc: 'Branding_Ads',
      metric: 'Chi phí - Branding',
      value: null,
      format: 'integer',
      isBold: false,
    },
    { hinh_thuc: 'Branding_Ads', metric: 'CPA', value: null, format: 'integer', isBold: false },
  ]

  return {
    rows,
    metadata: {
      pgm_present: pgm !== null,
      lgm_present: lgm !== null,
    },
  }
}

/**
 * Map raw TikTok data → 7 Step 2 fields (PGM 5 + LGM 2). NOT derived from
 * pivot — uses raw inputs directly, per Brief Note §15.10.
 * Consideration & Branding fields are NOT auto-filled.
 */
export function tiktokToAutoFill(pgm: TiktokPGMData | null, lgm: TiktokLGMData | null): TiktokAutoFill {
  return {
    t_pgm_doanh_so: pgm?.gmv ?? 0,
    t_pgm_chi_phi: pgm?.cost ?? 0,
    t_pgm_luot_xem: pgm?.hien_thi ?? 0,
    t_pgm_luot_click: pgm?.clicks ?? 0,
    t_pgm_don_hang: pgm?.orders ?? 0,
    t_lgm_doanhthu: lgm?.gmv ?? 0,
    t_lgm_chi_phi: lgm?.cost ?? 0,
  }
}

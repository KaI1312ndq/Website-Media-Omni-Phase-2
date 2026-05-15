/**
 * Test Shopee CSV parsers against fixture files + expected outputs from Brief V9.1.
 * Run: npx tsx scripts/test-parsers.ts
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  parseShopeeCPC,
  parseShopeeBranding,
  parseShopeeLive,
  buildShopeePivot,
  pivotToAutoFill,
  detectFileType,
  parseTiktokPGM,
  parseTiktokLGM,
  buildTiktokPivot,
  tiktokToAutoFill,
  detectTiktokFileType,
} from '../lib/report/parsers'

const FIXTURES = join(process.cwd(), 'tests/fixtures/report')

let failed = 0
let passed = 0

function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.log(`  ✗ ${label}`)
    failed++
  }
}

function assertEq<T>(actual: T, expected: T, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) {
    console.log(`  ✗ ${label}`)
    console.log(`      expected: ${JSON.stringify(expected)}`)
    console.log(`      actual:   ${JSON.stringify(actual)}`)
    failed++
  } else {
    console.log(`  ✓ ${label}`)
    passed++
  }
}

async function readAsFile(path: string, name: string): Promise<File> {
  const buf = await readFile(path)
  return new File([buf], name, { type: 'text/csv' })
}

async function main() {
  console.log('\n=== detectFileType ===')
  assertEq(
    detectFileType('Dữ+liệu+Dịch+vụ+Hiển+thị+Shopee-01_05_2026-10_05_2026.csv'),
    'shopee_cpc',
    'CPC filename',
  )
  assertEq(
    detectFileType('Dữ+liệu+Dịch+vụ+Hiển+thị+Tăng+nhận+diện+thương+hiệu+trên+Trang+kết+quả+tìm+kiếm-x.csv'),
    'shopee_branding',
    'Branding filename',
  )
  assertEq(
    detectFileType('Dữ-Liệu-Quảng-Cáo-Livestream-166737517-05_05_2026-11_05_2026.csv'),
    'shopee_live',
    'Live filename',
  )
  assertEq(detectFileType('random.csv'), null, 'Unknown filename → null')

  console.log('\n=== parseShopeeCPC ===')
  const cpcFile = await readAsFile(join(FIXTURES, 'shopee_cpc_sample.csv'), 'cpc.csv')
  const cpcRows = await parseShopeeCPC(cpcFile)
  assertEq(cpcRows.length, 3, 'returns 3 groups')
  const shopGmv = cpcRows.find(r => r.loai_dvht === 'Shop GMV Max')
  assertEq(shopGmv?.gmv, 98262579, 'Shop GMV Max — gmv')
  assertEq(shopGmv?.cost, 3167169, 'Shop GMV Max — cost')
  const sanPham = cpcRows.find(r => r.loai_dvht === 'Dịch vụ Hiển thị Sản phẩm')
  assertEq(sanPham?.gmv, 1880204068, 'Sản phẩm — gmv')
  assertEq(sanPham?.cost, 53382324, 'Sản phẩm — cost')
  const shop = cpcRows.find(r => r.loai_dvht === 'Dịch vụ Hiển thị Shop')
  assertEq(shop?.gmv, 425699454, 'Shop — gmv')
  assertEq(shop?.cost, 6892346, 'Shop — cost')

  console.log('\n=== parseShopeeBranding (chi tiết variant) ===')
  const brandFile = await readAsFile(join(FIXTURES, 'shopee_branding_sample.csv'), 'brand.csv')
  const brandRows = await parseShopeeBranding(brandFile)
  assertEq(brandRows.length, 1, 'returns 1 row')
  assertEq(brandRows[0]?.gmv, 139454780, 'Branding — gmv')
  assertEq(brandRows[0]?.cost, 4370000, 'Branding — cost')
  assertEq(brandRows[0]?.hien_thi, 3161, 'Branding — hien_thi')
  assertEq(brandRows[0]?.clicks, 760, 'Branding — clicks')
  assertEq(brandRows[0]?.orders, 321, 'Branding — orders (Sản phẩm đã bán)')

  console.log('\n=== parseShopeeBranding (tổng quan variant) ===')
  // File "Dữ+liệu+tổng+quan+tăng+nhận+diện+thương+hiệu-08_05_2026-14_05_2026.csv"
  // Header on row 7 (not row 11). Adaptive detection should handle it.
  // Data: row "T4_Thương hiệu" gmv=140274594 cost=23388897 hien_thi=10120
  //       clicks=2737 orders=883 (Sản phẩm đã bán); other rows are 0.
  const brandFile2 = await readAsFile(join(FIXTURES, 'shopee_branding_tongquan_sample.csv'), 'brand.csv')
  const brandRows2 = await parseShopeeBranding(brandFile2)
  assertEq(brandRows2.length, 1, 'tổng quan returns 1 row (aggregated)')
  assertEq(brandRows2[0]?.gmv, 140274594, 'tổng quan — gmv summed across campaigns')
  assertEq(brandRows2[0]?.cost, 23388897, 'tổng quan — cost summed')
  assertEq(brandRows2[0]?.hien_thi, 10120, 'tổng quan — hien_thi')
  assertEq(brandRows2[0]?.clicks, 2737, 'tổng quan — clicks')
  assertEq(brandRows2[0]?.orders, 883, 'tổng quan — orders')

  // Detect should match the tổng quan filename too
  assertEq(
    detectFileType('Dữ+liệu+tổng+quan+tăng+nhận+diện+thương+hiệu-08_05_2026-14_05_2026.csv'),
    'shopee_branding',
    'tổng quan filename → shopee_branding',
  )
  // Livestream tổng quan
  assertEq(
    detectFileType('Dữ+liệu+tổng+quan+Dịch+vụ+Hiển+thị+Livestream+-08_05_2026-14_05_2026.csv'),
    'shopee_live',
    'tổng quan Live filename → shopee_live',
  )

  console.log('\n=== parseShopeeLive ===')
  const liveFile = await readAsFile(join(FIXTURES, 'shopee_live_sample.csv'), 'live.csv')
  const liveRows = await parseShopeeLive(liveFile)
  assertEq(liveRows.length, 1, 'returns 1 row')
  assertEq(liveRows[0]?.gmv, 1584000, 'Live — gmv')
  assertEq(liveRows[0]?.cost, 213230, 'Live — cost')
  assertEq(liveRows[0]?.hien_thi, 5847, 'Live — hien_thi (Lượt xem)')
  assertEq(liveRows[0]?.clicks, null, 'Live — clicks = null')
  assertEq(liveRows[0]?.orders, 2, 'Live — orders (Số đơn hàng)')

  console.log('\n=== buildShopeePivot ===')
  const pivot = buildShopeePivot(cpcRows, brandRows, liveRows)
  // 3 + 1 (CPC total) + 1 + 1 (Brand total) + 1 + 1 (Live total) + 1 (grand) = 9
  assertEq(pivot.rows.length, 9, 'pivot has 9 rows')
  const cpcTotal = pivot.rows.find(r => r.hinh_thuc === 'Ads CPC' && r.isTotal && !r.isGrandTotal)
  assertEq(cpcTotal?.gmv, 98262579 + 1880204068 + 425699454, 'CPC Total — gmv')
  assertEq(cpcTotal?.cost, 3167169 + 53382324 + 6892346, 'CPC Total — cost')
  // ROAS = gmv / cost, recomputed after sum (NOT averaged)
  const expectedCpcRoas = +(cpcTotal!.gmv / cpcTotal!.cost).toFixed(2)
  assertEq(cpcTotal?.roas, expectedCpcRoas, `CPC Total — ROAS recomputed = ${expectedCpcRoas}`)

  const liveTotal = pivot.rows.find(r => r.hinh_thuc === 'Ads Live' && r.isTotal && !r.isGrandTotal)
  assertEq(liveTotal?.clicks, null, 'Live Total — clicks = null')
  assertEq(liveTotal?.cpc, null, 'Live Total — CPC = null (no clicks)')
  assertEq(liveTotal?.ctr, null, 'Live Total — CTR = null')
  assertEq(liveTotal?.cr, null, 'Live Total — CR = null')
  assert((liveTotal?.cpm ?? 0) > 0, 'Live Total — CPM computed (uses hien_thi)')

  const grand = pivot.rows[pivot.rows.length - 1]
  assert(grand.isGrandTotal === true, 'last row is grand total')
  assertEq(grand.pct_gmv, 100, 'grand — pct_gmv = 100')
  assertEq(grand.pct_cost, 100, 'grand — pct_cost = 100')
  // Grand clicks = sum across platforms (Live treated as 0)
  const expectedGrandClicks = (cpcTotal?.clicks ?? 0) + (brandRows[0]?.clicks ?? 0)
  assertEq(grand.clicks, expectedGrandClicks, `grand — clicks = ${expectedGrandClicks} (Live ignored)`)
  assert((grand.cpc ?? 0) > 0, 'grand — CPC computed (blended)')
  assert((grand.ctr ?? 0) > 0, 'grand — CTR computed')
  assert((grand.cr ?? 0) > 0, 'grand — CR computed')

  console.log('\n=== pivotToAutoFill ===')
  const fill = pivotToAutoFill(pivot)
  assertEq(fill.s_cpc_doanh_so, cpcTotal!.gmv, 's_cpc_doanh_so')
  assertEq(fill.s_cpc_chi_phi, cpcTotal!.cost, 's_cpc_chi_phi')
  assertEq(fill.s_nd_gmv, 139454780, 's_nd_gmv')
  assertEq(fill.s_nd_chi_phi, 4370000, 's_nd_chi_phi')
  assertEq(fill.s_live_gmv, 1584000, 's_live_gmv')
  assertEq(fill.s_live_chi_phi, 213230, 's_live_chi_phi')
  assertEq(fill.s_live_luot_xem, 5847, 's_live_luot_xem')

  /* ════════════════════════════════════════════════════════════
     TIKTOK — Phase 2B
     Expected values per Brief V9.2 mục 13 (sample 01/05 – 11/05/2026):
       PGM gmv=932_069_592.16, cost=116_329_700.01, hien_thi=1_790_062, clicks=82_791, orders=5_232
       LGM gmv=694_520_019.29, cost=70_068_541
       Total: GMV ≈ 1_626_589_611.45, Cost ≈ 186_398_241.01, ROI ≈ 8.73
       PGM derived: ROAS≈8.01, CPC≈1.405, CTR≈4.63%, CR≈6.32%, CPM≈64.986, AOV≈178.148
       LGM ROI ≈ 9.91
  ════════════════════════════════════════════════════════════ */
  console.log('\n=== detectTiktokFileType ===')
  assertEq(
    detectTiktokFileType('creative data for product campaigns (2026-05-01 00 ~ 2026-05-11 23).xlsx'),
    'tiktok_pgm',
    'PGM filename',
  )
  assertEq(
    detectTiktokFileType('livestream data for live campaigns (2026-05-01 00 ~ 2026-05-11 23).xlsx'),
    'tiktok_lgm',
    'LGM filename',
  )
  assertEq(detectTiktokFileType('random.xlsx'), null, 'Unknown filename → null')

  console.log('\n=== parseTiktokPGM ===')
  const pgmFile = await readAsFile(join(FIXTURES, 'tiktok_pgm_sample.xlsx'), 'pgm.xlsx')
  const pgm = await parseTiktokPGM(pgmFile)
  assert(Math.abs(pgm.gmv - 932_069_592.16) < 1, `PGM gmv ≈ 932,069,592.16 (got ${pgm.gmv})`)
  assert(Math.abs(pgm.cost - 116_329_700.01) < 1, `PGM cost ≈ 116,329,700.01 (got ${pgm.cost})`)
  assertEq(pgm.hien_thi, 1_790_062, 'PGM hien_thi = 1,790,062')
  assertEq(pgm.clicks, 82_791, 'PGM clicks = 82,791')
  assertEq(pgm.orders, 5_232, 'PGM orders = 5,232')

  console.log('\n=== parseTiktokLGM ===')
  const lgmFile = await readAsFile(join(FIXTURES, 'tiktok_lgm_sample.xlsx'), 'lgm.xlsx')
  const lgm = await parseTiktokLGM(lgmFile)
  assert(Math.abs(lgm.gmv - 694_520_019.29) < 1, `LGM gmv ≈ 694,520,019.29 (got ${lgm.gmv})`)
  assertEq(lgm.cost, 70_068_541, 'LGM cost = 70,068,541')

  console.log('\n=== buildTiktokPivot ===')
  const tPivot = buildTiktokPivot(pgm, lgm)
  // 3 Ads_Total + 11 Ads_PGM + 3 Ads_LGM + 3 Consideration + 4 Branding = 24 rows
  assertEq(tPivot.rows.length, 24, 'pivot has 24 rows')

  const totalGmvRow = tPivot.rows.find(r => r.hinh_thuc === 'Ads_Total' && r.metric === 'Doanh thu Ads')
  assert(Math.abs((totalGmvRow?.value ?? 0) - 1_626_589_611.45) < 1, 'Ads_Total Doanh thu Ads')
  const totalCostRow = tPivot.rows.find(r => r.hinh_thuc === 'Ads_Total' && r.metric === 'Chi phí Ads')
  assert(Math.abs((totalCostRow?.value ?? 0) - 186_398_241.01) < 1, 'Ads_Total Chi phí Ads')
  const totalRoiRow = tPivot.rows.find(r => r.hinh_thuc === 'Ads_Total' && r.metric === 'ROI')
  assertEq(totalRoiRow?.value, 8.73, 'Ads_Total ROI = 8.73')
  assert(totalRoiRow?.isBold === true, 'Ads_Total rows are bold')

  const pgmRoasRow = tPivot.rows.find(r => r.hinh_thuc === 'Ads_PGM' && r.metric === 'ROAS')
  assertEq(pgmRoasRow?.value, 8.01, 'PGM ROAS = 8.01')
  const pgmCpcRow = tPivot.rows.find(r => r.hinh_thuc === 'Ads_PGM' && r.metric === 'CPC')
  assertEq(pgmCpcRow?.value, 1405, 'PGM CPC = 1,405')
  const pgmCtrRow = tPivot.rows.find(r => r.hinh_thuc === 'Ads_PGM' && r.metric === 'CTR')
  assertEq(pgmCtrRow?.value, 4.63, 'PGM CTR = 4.63%')
  const pgmCrRow = tPivot.rows.find(r => r.hinh_thuc === 'Ads_PGM' && r.metric === 'CR')
  assertEq(pgmCrRow?.value, 6.32, 'PGM CR = 6.32%')
  const pgmCpmRow = tPivot.rows.find(r => r.hinh_thuc === 'Ads_PGM' && r.metric === 'CPM')
  assertEq(pgmCpmRow?.value, 64986, 'PGM CPM = 64,986')
  const pgmAovRow = tPivot.rows.find(r => r.hinh_thuc === 'Ads_PGM' && r.metric === 'AOV')
  assertEq(pgmAovRow?.value, 178148, 'PGM AOV = 178,148')

  const lgmRoiRow = tPivot.rows.find(r => r.hinh_thuc === 'Ads_LGM' && r.metric === 'ROI')
  assertEq(lgmRoiRow?.value, 9.91, 'LGM ROI = 9.91')

  const considerationRows = tPivot.rows.filter(r => r.hinh_thuc === 'Consideration_Ads')
  assertEq(considerationRows.length, 3, 'Consideration_Ads has 3 rows')
  assert(
    considerationRows.every(r => r.value === null),
    'Consideration_Ads all null',
  )

  const brandingRows = tPivot.rows.filter(r => r.hinh_thuc === 'Branding_Ads')
  assertEq(brandingRows.length, 4, 'Branding_Ads has 4 rows')
  assert(
    brandingRows.every(r => r.value === null),
    'Branding_Ads all null',
  )

  // Verify ordering
  const order = tPivot.rows.map(r => r.hinh_thuc)
  const firstAdsTotal = order.indexOf('Ads_Total')
  const firstPGM = order.indexOf('Ads_PGM')
  const firstLGM = order.indexOf('Ads_LGM')
  const firstConsid = order.indexOf('Consideration_Ads')
  const firstBranding = order.indexOf('Branding_Ads')
  assert(
    firstAdsTotal === 0 &&
      firstAdsTotal < firstPGM &&
      firstPGM < firstLGM &&
      firstLGM < firstConsid &&
      firstConsid < firstBranding,
    'Order: Total → PGM → LGM → Consideration → Branding',
  )

  console.log('\n=== tiktokToAutoFill ===')
  const tFill = tiktokToAutoFill(pgm, lgm)
  assertEq(tFill.t_pgm_doanh_so, pgm.gmv, 't_pgm_doanh_so = PGM gmv')
  assertEq(tFill.t_pgm_chi_phi, pgm.cost, 't_pgm_chi_phi = PGM cost')
  assertEq(tFill.t_pgm_luot_xem, 1_790_062, 't_pgm_luot_xem = 1,790,062')
  assertEq(tFill.t_pgm_luot_click, 82_791, 't_pgm_luot_click = 82,791')
  assertEq(tFill.t_pgm_don_hang, 5_232, 't_pgm_don_hang = 5,232')
  assertEq(tFill.t_lgm_doanhthu, lgm.gmv, 't_lgm_doanhthu = LGM gmv')
  assertEq(tFill.t_lgm_chi_phi, 70_068_541, 't_lgm_chi_phi = 70,068,541')

  // Missing-file scenarios
  const tPivotPGMOnly = buildTiktokPivot(pgm, null)
  const lgmInPGMOnly = tPivotPGMOnly.rows.find(r => r.hinh_thuc === 'Ads_LGM' && r.metric === 'Doanh thu LGM')
  assertEq(lgmInPGMOnly?.value, 0, 'LGM = 0 when only PGM uploaded')
  const tPivotEmpty = buildTiktokPivot(null, null)
  const totalEmptyRoi = tPivotEmpty.rows.find(r => r.hinh_thuc === 'Ads_Total' && r.metric === 'ROI')
  assertEq(totalEmptyRoi?.value, null, 'Empty pivot: Total ROI = null')

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`Passed: ${passed}   Failed: ${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch(e => {
  console.error('\n💥 Test crashed:', e)
  process.exit(1)
})

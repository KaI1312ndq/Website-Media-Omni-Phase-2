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

  console.log('\n=== parseShopeeBranding ===')
  const brandFile = await readAsFile(join(FIXTURES, 'shopee_branding_sample.csv'), 'brand.csv')
  const brandRows = await parseShopeeBranding(brandFile)
  assertEq(brandRows.length, 1, 'returns 1 row')
  assertEq(brandRows[0]?.gmv, 139454780, 'Branding — gmv')
  assertEq(brandRows[0]?.cost, 4370000, 'Branding — cost')
  assertEq(brandRows[0]?.hien_thi, 3161, 'Branding — hien_thi')
  assertEq(brandRows[0]?.clicks, 760, 'Branding — clicks')
  assertEq(brandRows[0]?.orders, 321, 'Branding — orders (Sản phẩm đã bán)')

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
  // Grand clicks = null because Live has null
  assertEq(grand.clicks, null, 'grand — clicks = null (Live propagates)')

  console.log('\n=== pivotToAutoFill ===')
  const fill = pivotToAutoFill(pivot)
  assertEq(fill.s_cpc_doanh_so, cpcTotal!.gmv, 's_cpc_doanh_so')
  assertEq(fill.s_cpc_chi_phi, cpcTotal!.cost, 's_cpc_chi_phi')
  assertEq(fill.s_nd_gmv, 139454780, 's_nd_gmv')
  assertEq(fill.s_nd_chi_phi, 4370000, 's_nd_chi_phi')
  assertEq(fill.s_live_gmv, 1584000, 's_live_gmv')
  assertEq(fill.s_live_chi_phi, 213230, 's_live_chi_phi')
  assertEq(fill.s_live_luot_xem, 5847, 's_live_luot_xem')

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`Passed: ${passed}   Failed: ${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch(e => {
  console.error('\n💥 Test crashed:', e)
  process.exit(1)
})

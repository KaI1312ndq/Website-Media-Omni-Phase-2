/**
 * Pure utilities for the Weekly Report tool — no React, no DOM.
 */
import type { ShopeeData, TiktokData, WeekInfo } from './types'

export function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fmtNum(n: number, unit: string): string {
  if (!n && n !== 0) return '—'
  if (unit === '₫') return n.toLocaleString('vi-VN')
  if (unit === 'x') return n.toFixed(2)
  if (unit === '%') return n.toFixed(2) + '%'
  if (unit === '‰') return n.toFixed(0) + '‰'
  return n.toLocaleString('vi-VN')
}

/** Format integer with Vietnamese thousand separator (dot). */
export function fmtVN(v: number | string): string {
  const raw = String(v ?? '').replace(/[^\d-]/g, '')
  if (!raw || raw === '-') return ''
  const num = parseInt(raw, 10)
  if (isNaN(num)) return ''
  return num.toLocaleString('vi-VN')
}

/** Parse VN-formatted input — strips thousand separators and non-numeric chars. */
export function parseVN(s: string): number {
  if (!s) return 0
  return (
    parseFloat(
      String(s)
        .replace(/[.,\s]/g, '')
        .replace(/[^\d.-]/g, ''),
    ) || 0
  )
}

/** Evaluate a math expression like "100+200" → 300; returns NaN if invalid or no operator. */
export function evalExpr(s: string): number {
  const stripped = s.replace(/[.,\s]/g, '')
  if (!/[+\-*/]/.test(stripped)) return NaN
  if (!/^[\d+\-*/().]+$/.test(stripped)) return NaN
  try {
    const r = Function('"use strict";return(' + stripped + ')')()
    if (!isFinite(r) || isNaN(r)) return NaN
    return Math.round(Number(r))
  } catch {
    return NaN
  }
}

export function pct(actual: number, plan: number | undefined): number | null {
  if (!plan) return null
  return parseFloat(((actual / plan) * 100).toFixed(1))
}

export function pctClass(p: number | null): string {
  if (p === null) return ''
  if (p >= 100) return 'g'
  if (p >= 80) return 'y'
  return 'r'
}

export function n(v: string | number | null | undefined): number {
  return parseFloat(String(v ?? 0)) || 0
}

/* ── Week calculation (UpBase calendar: week starts Friday, ends Thursday) ── */
export function getWeekInfo(month: number, year: number, weekNum: number): WeekInfo {
  const firstDay = new Date(year, month - 1, 1)
  const fridays: Date[] = []
  const d = new Date(firstDay)
  while (d.getMonth() === month - 1) {
    if (d.getDay() === 5) fridays.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  const friday = fridays[weekNum - 1] || fridays[0]
  const thursday = new Date(friday)
  thursday.setDate(friday.getDate() + 6)
  const lastDay = new Date(year, month - 1, new Date(year, month, 0).getDate())
  const weekEnd = thursday > lastDay ? lastDay : thursday
  const days = Math.round((weekEnd.getTime() - friday.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const quarter = Math.ceil(month / 3)
  return {
    weekNum,
    month,
    year,
    quarter,
    label: `W${weekNum} Tháng ${month} Q${quarter}.${year}`,
    start: fmtDate(friday),
    end: fmtDate(weekEnd),
    startISO: toISO(friday),
    endISO: toISO(weekEnd),
    days,
    isFull: days === 7,
  }
}

export function getWeeksInMonth(month: number, year: number): number {
  const d = new Date(year, month - 1, 1)
  let count = 0
  while (d.getMonth() === month - 1) {
    if (d.getDay() === 5) count++
    d.setDate(d.getDate() + 1)
  }
  return count || 4
}

export function getCurrentWeekDefault(month: number, year: number): number {
  const today = new Date()
  const d = new Date(year, month - 1, 1)
  let weekNum = 0
  while (d <= today && d.getMonth() === month - 1) {
    if (d.getDay() === 5) weekNum++
    d.setDate(d.getDate() + 1)
  }
  return weekNum || 1
}

/* ── Calc helpers per sub-section ── */
export function calcCPC(d: ShopeeData) {
  const roas = d.s_cpc_chi_phi ? +(d.s_cpc_doanh_so / d.s_cpc_chi_phi).toFixed(2) : 0
  const cpc = d.s_cpc_luot_click ? +(d.s_cpc_chi_phi / d.s_cpc_luot_click).toFixed(0) : 0
  const ctr = d.s_cpc_luot_xem ? +((d.s_cpc_luot_click / d.s_cpc_luot_xem) * 100).toFixed(2) : 0
  const cr = d.s_cpc_luot_click ? +((d.s_cpc_don_hang / d.s_cpc_luot_click) * 100).toFixed(2) : 0
  const aov = d.s_cpc_don_hang ? +(d.s_cpc_doanh_so / d.s_cpc_don_hang).toFixed(0) : 0
  return { roas, cpc, ctr, cr, aov }
}

export function calcND(d: ShopeeData) {
  const roas = d.s_nd_chi_phi ? +(d.s_nd_gmv / d.s_nd_chi_phi).toFixed(2) : 0
  const cpc = d.s_nd_luot_click ? +(d.s_nd_chi_phi / d.s_nd_luot_click).toFixed(0) : 0
  const ctr = d.s_nd_luot_xem ? +((d.s_nd_luot_click / d.s_nd_luot_xem) * 100).toFixed(2) : 0
  return { roas, cpc, ctr }
}

export function calcLive(d: ShopeeData) {
  const roas = d.s_live_chi_phi ? +(d.s_live_gmv / d.s_live_chi_phi).toFixed(2) : 0
  return { roas }
}

export function calcPGM(d: TiktokData) {
  const roas = d.t_pgm_chi_phi ? +(d.t_pgm_doanh_so / d.t_pgm_chi_phi).toFixed(2) : 0
  const cpc = d.t_pgm_luot_click ? +(d.t_pgm_chi_phi / d.t_pgm_luot_click).toFixed(0) : 0
  const ctr = d.t_pgm_luot_xem ? +((d.t_pgm_luot_click / d.t_pgm_luot_xem) * 100).toFixed(2) : 0
  const cr = d.t_pgm_luot_click ? +((d.t_pgm_don_hang / d.t_pgm_luot_click) * 100).toFixed(2) : 0
  const cpm = d.t_pgm_luot_xem ? +((d.t_pgm_chi_phi / d.t_pgm_luot_xem) * 1000).toFixed(0) : 0
  const aov = d.t_pgm_don_hang ? +(d.t_pgm_doanh_so / d.t_pgm_don_hang).toFixed(0) : 0
  return { roas, cpc, ctr, cr, cpm, aov }
}

export function calcLGM(d: TiktokData) {
  const roi = d.t_lgm_chi_phi ? +(d.t_lgm_doanhthu / d.t_lgm_chi_phi).toFixed(2) : 0
  return { roi }
}

export function calcCon(d: TiktokData) {
  const cpa = d.t_con_nguoi ? +(d.t_con_chi_phi / d.t_con_nguoi).toFixed(0) : 0
  return { cpa }
}

export function calcBrd(d: TiktokData) {
  const cpa = d.t_brd_follow ? +(d.t_brd_chi_phi / d.t_brd_follow).toFixed(0) : 0
  return { cpa }
}

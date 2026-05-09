'use client'

import { useState, FormEvent } from 'react'
import { Icon } from '@/lib/icons'

type Channel = 'shopee' | 'tiktok' | 'meta' | 'google' | 'livestream'
type Budget = '<50M' | '50-200M' | '200-500M' | '>500M'

const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'shopee', label: 'Shopee' },
  { key: 'tiktok', label: 'TikTok Shop' },
  { key: 'meta', label: 'Meta' },
  { key: 'google', label: 'Google' },
  { key: 'livestream', label: 'Livestream' },
]
const BUDGETS: { key: Budget; label: string }[] = [
  { key: '<50M', label: '< 50M' },
  { key: '50-200M', label: '50-200M' },
  { key: '200-500M', label: '200-500M' },
  { key: '>500M', label: '> 500M' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^0\d{9}$/

interface FormState {
  name: string
  email: string
  phone: string
  brand: string
  channels: Channel[]
  monthly_budget: Budget | ''
  note: string
}

export default function LeadForm() {
  const [form, setForm] = useState<FormState>({
    name: '', email: '', phone: '', brand: '', channels: [], monthly_budget: '', note: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  function toggleChannel(c: Channel) {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(c) ? f.channels.filter(x => x !== c) : [...f.channels, c],
    }))
    if (errors.channels) setErrors(e => ({ ...e, channels: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (form.name.trim().length < 2) e.name = 'Vui lòng nhập tên (≥ 2 ký tự)'
    if (form.name.length > 100) e.name = 'Tên quá dài'
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Email không hợp lệ'
    if (form.phone && !PHONE_RE.test(form.phone.trim())) e.phone = 'SĐT phải 10 số bắt đầu bằng 0'
    if (form.channels.length === 0) e.channels = 'Chọn ít nhất 1 kênh'
    if (!form.monthly_budget) e.monthly_budget = 'Chọn ngân sách dự kiến'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    setServerError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      const utmParams = new URLSearchParams(window.location.search)
      const r = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          utm_source: utmParams.get('utm_source') || undefined,
          utm_medium: utmParams.get('utm_medium') || undefined,
          utm_campaign: utmParams.get('utm_campaign') || undefined,
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Lỗi gửi')

      // GA4 event
      if (typeof window !== 'undefined') {
        const w = window as unknown as { gtag?: (...args: unknown[]) => void }
        if (typeof w.gtag === 'function') {
          w.gtag('event', 'lead_submit', {
            lead_channels: form.channels.join(','),
            lead_budget: form.monthly_budget || 'unknown',
          })
        }
      }
      setSuccess(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Lỗi gửi')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setForm({ name: '', email: '', phone: '', brand: '', channels: [], monthly_budget: '', note: '' })
    setErrors({})
    setSuccess(false)
    setServerError('')
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="lead-form" className="lead-form-section">
      <div className="lead-form-glow-1" />
      <div className="lead-form-glow-2" />
      <div className="lead-form-grid-bg" />
      <div className="container">
        <div className="lead-form-wrap rv">
          {/* LEFT */}
          <div className="lead-form-left">
            <div className="sec-label sec-label--white">Audit miễn phí</div>
            <h2 className="sec-title sec-title--white">Sẵn sàng <span className="grad-text">scale brand?</span></h2>
            <p className="sec-sub sec-sub--white" style={{ marginTop: 12 }}>
              Để team Media Omni audit performance hiện tại của bạn — báo cáo chi tiết roadmap optimize, miễn phí trong 48h.
            </p>
            <ul className="lead-form-bullets">
              {[
                'Audit tài khoản ads hiện tại',
                'Đề xuất chiến lược 90 ngày',
                'Báo cáo benchmark với industry',
              ].map(b => (
                <li key={b}>
                  <span className="lf-check">{Icon.check(14)}</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="lead-form-stats">
              <span className="blue-grad" style={{ fontWeight: 800 }}>100+ brands trusted</span>
              <span className="lf-dot" />
              <span><strong>&gt;7x</strong> ROAS</span>
            </div>
          </div>

          {/* RIGHT — form / success */}
          <div className="lead-form-right">
            {success ? (
              <div className="lead-success">
                <div className="lf-success-circle">{Icon.check(36)}</div>
                <h3 className="lf-success-title">Cảm ơn {form.name || 'bạn'}!</h3>
                <p className="lf-success-body">
                  Team Media Omni sẽ liên hệ bạn trong vòng 48h qua email + phone.
                </p>
                <button type="button" className="btn-primary" onClick={reset}>
                  Quay lại trang chủ
                </button>
              </div>
            ) : (
              <form className="lead-form" onSubmit={handleSubmit} noValidate>
                <div className="lf-grid-2">
                  <div className="lf-field">
                    <label className="lf-label">Họ tên *</label>
                    <input
                      className={`lf-input${errors.name ? ' lf-err' : ''}`}
                      type="text" value={form.name}
                      onChange={e => update('name', e.target.value)}
                      placeholder="Nguyễn Văn A"
                      maxLength={100}
                    />
                    {errors.name && <div className="lf-error">{errors.name}</div>}
                  </div>
                  <div className="lf-field">
                    <label className="lf-label">Email *</label>
                    <input
                      className={`lf-input${errors.email ? ' lf-err' : ''}`}
                      type="email" value={form.email}
                      onChange={e => update('email', e.target.value)}
                      placeholder="ban@brand.com"
                    />
                    {errors.email && <div className="lf-error">{errors.email}</div>}
                  </div>
                  <div className="lf-field">
                    <label className="lf-label">Số điện thoại</label>
                    <input
                      className={`lf-input${errors.phone ? ' lf-err' : ''}`}
                      type="tel" value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      placeholder="09xxxxxxxx"
                    />
                    {errors.phone && <div className="lf-error">{errors.phone}</div>}
                  </div>
                  <div className="lf-field">
                    <label className="lf-label">Brand / Công ty</label>
                    <input
                      className="lf-input"
                      type="text" value={form.brand}
                      onChange={e => update('brand', e.target.value)}
                      placeholder="Tên thương hiệu"
                    />
                  </div>
                </div>

                <div className="lf-field">
                  <label className="lf-label">Kênh quan tâm *</label>
                  <div className="lf-chips">
                    {CHANNELS.map(c => (
                      <button
                        key={c.key} type="button"
                        className={`lf-chip${form.channels.includes(c.key) ? ' on' : ''}`}
                        onClick={() => toggleChannel(c.key)}
                      >{c.label}</button>
                    ))}
                  </div>
                  {errors.channels && <div className="lf-error">{errors.channels}</div>}
                </div>

                <div className="lf-field">
                  <label className="lf-label">Ngân sách / tháng *</label>
                  <div className="lf-chips">
                    {BUDGETS.map(b => (
                      <button
                        key={b.key} type="button"
                        className={`lf-chip${form.monthly_budget === b.key ? ' on' : ''}`}
                        onClick={() => update('monthly_budget', b.key)}
                      >{b.label}</button>
                    ))}
                  </div>
                  {errors.monthly_budget && <div className="lf-error">{errors.monthly_budget}</div>}
                </div>

                <div className="lf-field">
                  <label className="lf-label">Ghi chú</label>
                  <textarea
                    className="lf-input lf-textarea"
                    value={form.note}
                    onChange={e => update('note', e.target.value)}
                    placeholder="Mô tả ngắn về thương hiệu, mục tiêu, hoặc câu hỏi của bạn..."
                    rows={3}
                    maxLength={2000}
                  />
                </div>

                {serverError && <div className="lf-error" style={{ marginBottom: 8 }}>{serverError}</div>}

                <button type="submit" className="lf-submit" disabled={submitting}>
                  {submitting ? 'Đang gửi...' : (
                    <>
                      Gửi yêu cầu
                      <span style={{ display: 'inline-flex' }}>{Icon.send(15)}</span>
                    </>
                  )}
                </button>
                <p className="lf-fineprint">
                  Bằng việc gửi, bạn đồng ý với chính sách bảo mật của Media Omni.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

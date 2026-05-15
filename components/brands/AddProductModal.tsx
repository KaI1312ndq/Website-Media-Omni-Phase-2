'use client'

/**
 * Modal "Thêm sản phẩm" dùng chung cho Master Shopee + TikTok.
 * Generic field config — caller truyền fields, values, callbacks.
 */

import { useEffect, useRef } from 'react'

interface Field {
  key: string
  label: string
  placeholder?: string
  required?: boolean
  long?: boolean // textarea thay vì input
}

interface Props {
  title: string
  fields: Field[]
  values: Record<string, string>
  onChange: (v: Record<string, string>) => void
  busy: boolean
  onCancel: () => void
  onSubmit: () => void
  /** Autocomplete suggestions cho field nào đó (vd: ten_define) */
  existingDefines?: string[]
  defineFieldKey?: string
}

export default function AddProductModal({
  title,
  fields,
  values,
  onChange,
  busy,
  onCancel,
  onSubmit,
  existingDefines,
  defineFieldKey,
}: Props) {
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  const datalistId = 'add-modal-defines'

  function onSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!busy) onSubmit()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => !busy && onCancel()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.6)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={onSubmitForm}
        style={{
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 12,
          padding: 20,
          maxWidth: 500,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f1f5f9' }}>{title}</h3>

        {existingDefines && existingDefines.length > 0 && (
          <datalist id={datalistId}>
            {existingDefines.map(s => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fields.map((f, idx) => {
            const isDefineField = defineFieldKey === f.key && existingDefines
            const common = {
              value: values[f.key] ?? '',
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                onChange({ [f.key]: e.target.value }),
              placeholder: f.placeholder,
              required: f.required,
              disabled: busy,
              style: inputStyle,
            }
            return (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>{f.label}</label>
                {f.long ? (
                  <textarea
                    {...common}
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
                  />
                ) : (
                  <input
                    {...common}
                    ref={idx === 0 ? firstInputRef : undefined}
                    type="text"
                    list={isDefineField ? datalistId : undefined}
                  />
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" className="btn-s" onClick={onCancel} disabled={busy}>
            Huỷ
          </button>
          <button type="submit" className="btn-p" disabled={busy}>
            {busy ? 'Đang thêm...' : 'Thêm'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
}

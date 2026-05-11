'use client'

import { useCallback, useState, type DragEvent } from 'react'
import { Icon } from '@/lib/icons'
import { detectFileType, type ShopeeFileType } from '@/lib/report/parsers'

export type UploadedFiles = {
  shopee_cpc: File | null
  shopee_branding: File | null
  shopee_live: File | null
}

interface Props {
  files: UploadedFiles
  onChange: (files: UploadedFiles) => void
  onError: (msg: string) => void
}

const MAX_BYTES = 10 * 1024 * 1024 // 10MB

const TYPE_LABEL: Record<ShopeeFileType, string> = {
  shopee_cpc: 'Shopee CPC',
  shopee_branding: 'Shopee Branding',
  shopee_live: 'Shopee Live',
}

const TYPE_COLOR: Record<ShopeeFileType, string> = {
  shopee_cpc: '#3b82f6',
  shopee_branding: '#a855f7',
  shopee_live: '#f97316',
}

export default function FileUploadZone({ files, onChange, onError }: Props) {
  const [drag, setDrag] = useState(false)
  // Track files that auto-detect couldn't identify — user picks type manually.
  const [pending, setPending] = useState<{ file: File; id: string }[]>([])

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming)
      const next = { ...files }
      const newPending: { file: File; id: string }[] = []

      for (const f of list) {
        if (!/\.csv$/i.test(f.name)) {
          onError(`Chỉ hỗ trợ file .csv (file "${f.name}" bị bỏ qua)`)
          continue
        }
        if (f.size > MAX_BYTES) {
          onError(`File "${f.name}" quá lớn (>10MB), bị bỏ qua`)
          continue
        }
        const type = detectFileType(f.name)
        if (type) {
          if (next[type]) {
            onError(`Đã thay thế file ${TYPE_LABEL[type]} cũ`)
          }
          next[type] = f
        } else {
          newPending.push({ file: f, id: `${f.name}-${Date.now()}-${Math.random()}` })
        }
      }

      if (newPending.length > 0) {
        setPending(p => [...p, ...newPending])
        onError(`${newPending.length} file không nhận diện được — chọn loại bên dưới`)
      }
      onChange(next)
    },
    [files, onChange, onError],
  )

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDrag(false)
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }

  function removeFile(type: ShopeeFileType) {
    onChange({ ...files, [type]: null })
  }

  function assignPending(id: string, type: ShopeeFileType) {
    const entry = pending.find(p => p.id === id)
    if (!entry) return
    if (files[type]) onError(`Đã thay thế file ${TYPE_LABEL[type]} cũ`)
    onChange({ ...files, [type]: entry.file })
    setPending(p => p.filter(x => x.id !== id))
  }

  function discardPending(id: string) {
    setPending(p => p.filter(x => x.id !== id))
  }

  return (
    <div>
      <div
        onDragOver={e => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${drag ? '#60a5fa' : 'rgba(255,255,255,.18)'}`,
          background: drag ? 'rgba(59,130,246,.08)' : 'rgba(255,255,255,.02)',
          borderRadius: 14,
          padding: '32px 20px',
          textAlign: 'center',
          transition: 'all .15s',
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('shopee-file-input')?.click()}
      >
        <div style={{ display: 'inline-flex', color: '#60a5fa', marginBottom: 10 }}>{Icon.send(28)}</div>
        <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
          {(() => {
            const count = [files.shopee_cpc, files.shopee_branding, files.shopee_live].filter(Boolean).length
            return count === 0
              ? 'Kéo thả file CSV vào đây hoặc click để chọn'
              : count === 3
                ? 'Đã đủ 3 file — kéo thêm để thay thế'
                : `Đã có ${count}/3 file — kéo thêm hoặc thay thế`
          })()}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          Hỗ trợ: CPC, Branding, Livestream · Tối đa 10MB / file · Auto parse sau khi upload
        </div>
        <input
          id="shopee-file-input"
          type="file"
          accept=".csv,text/csv"
          multiple
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = '' // allow re-upload same file
          }}
        />
      </div>

      {/* Recognized files */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(['shopee_cpc', 'shopee_branding', 'shopee_live'] as ShopeeFileType[]).map(type => {
          const f = files[type]
          if (!f) return null
          return (
            <div
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'rgba(16,185,129,.08)',
                border: '1px solid rgba(16,185,129,.25)',
                borderRadius: 10,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 8px',
                  background: TYPE_COLOR[type],
                  color: '#fff',
                  borderRadius: 5,
                }}
              >
                {TYPE_LABEL[type]}
              </span>
              <span
                style={{
                  flex: 1,
                  color: '#cbd5e1',
                  fontSize: 13,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.name}
              </span>
              <span style={{ color: '#94a3b8', fontSize: 11 }}>{(f.size / 1024).toFixed(1)} KB</span>
              <button
                type="button"
                onClick={() => removeFile(type)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'inline-flex',
                }}
                title="Xoá"
              >
                {Icon.trash(15)}
              </button>
            </div>
          )
        })}

        {/* Pending (unrecognized) files */}
        {pending.map(p => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'rgba(251,191,36,.08)',
              border: '1px solid rgba(251,191,36,.3)',
              borderRadius: 10,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                background: '#fbbf24',
                color: '#422006',
                borderRadius: 5,
              }}
            >
              ? Chọn loại
            </span>
            <span
              style={{
                flex: 1,
                color: '#cbd5e1',
                fontSize: 13,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {p.file.name}
            </span>
            <select
              onChange={e => assignPending(p.id, e.target.value as ShopeeFileType)}
              defaultValue=""
              style={{
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.15)',
                color: '#cbd5e1',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              <option value="" disabled>
                — Loại file —
              </option>
              <option value="shopee_cpc">Shopee CPC</option>
              <option value="shopee_branding">Shopee Branding</option>
              <option value="shopee_live">Shopee Live</option>
            </select>
            <button
              type="button"
              onClick={() => discardPending(p.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'inline-flex',
              }}
              title="Bỏ qua"
            >
              {Icon.trash(15)}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

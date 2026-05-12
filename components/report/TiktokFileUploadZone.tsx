'use client'

import { useCallback, useState, type DragEvent } from 'react'
import { Icon } from '@/lib/icons'
import { detectTiktokFileType, type TiktokFileType } from '@/lib/report/parsers'

export type TiktokUploadedFiles = {
  tiktok_pgm: File | null
  tiktok_lgm: File | null
}

interface Props {
  files: TiktokUploadedFiles
  onChange: (files: TiktokUploadedFiles) => void
  onError: (msg: string) => void
}

// Allow larger for PGM (33K rows ≈ 4-8MB possible).
const MAX_BYTES = 20 * 1024 * 1024

const TYPE_LABEL: Record<TiktokFileType, string> = {
  tiktok_pgm: 'TikTok PGM',
  tiktok_lgm: 'TikTok LGM',
}

const TYPE_COLOR: Record<TiktokFileType, string> = {
  tiktok_pgm: '#a855f7',
  tiktok_lgm: '#f97316',
}

export default function TiktokFileUploadZone({ files, onChange, onError }: Props) {
  const [drag, setDrag] = useState(false)
  const [pending, setPending] = useState<{ file: File; id: string }[]>([])

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming)
      const next = { ...files }
      const newPending: { file: File; id: string }[] = []

      for (const f of list) {
        if (!/\.xlsx$/i.test(f.name) && !/\.xls$/i.test(f.name)) {
          onError(`Chỉ hỗ trợ file .xlsx (file "${f.name}" bị bỏ qua)`)
          continue
        }
        if (f.size > MAX_BYTES) {
          onError(`File "${f.name}" quá lớn (>20MB), bị bỏ qua`)
          continue
        }
        const type = detectTiktokFileType(f.name)
        if (type) {
          if (next[type]) onError(`Đã thay thế file ${TYPE_LABEL[type]} cũ`)
          next[type] = f
        } else {
          newPending.push({ file: f, id: `${f.name}-${Date.now()}-${Math.random()}` })
        }
      }

      if (newPending.length > 0) {
        setPending(p => [...p, ...newPending])
        onError(`${newPending.length} file TikTok không nhận diện được — chọn loại bên dưới`)
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

  function removeFile(type: TiktokFileType) {
    onChange({ ...files, [type]: null })
  }

  function assignPending(id: string, type: TiktokFileType) {
    const entry = pending.find(p => p.id === id)
    if (!entry) return
    if (files[type]) onError(`Đã thay thế file ${TYPE_LABEL[type]} cũ`)
    onChange({ ...files, [type]: entry.file })
    setPending(p => p.filter(x => x.id !== id))
  }

  function discardPending(id: string) {
    setPending(p => p.filter(x => x.id !== id))
  }

  const count = [files.tiktok_pgm, files.tiktok_lgm].filter(Boolean).length

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
          border: `2px dashed ${drag ? '#a78bfa' : 'rgba(255,255,255,.18)'}`,
          background: drag ? 'rgba(168,85,247,.08)' : 'rgba(255,255,255,.02)',
          borderRadius: 14,
          padding: '28px 20px',
          textAlign: 'center',
          transition: 'all .15s',
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('tiktok-file-input')?.click()}
      >
        <div style={{ display: 'inline-flex', color: '#a78bfa', marginBottom: 10 }}>{Icon.send(28)}</div>
        <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
          {count === 0
            ? 'Kéo thả file xlsx vào đây hoặc click để chọn'
            : count === 2
              ? 'Đã đủ 2 file — kéo thêm để thay thế'
              : `Đã có ${count}/2 file — kéo thêm hoặc thay thế`}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          Hỗ trợ: PGM (Product Campaigns) + LGM (Live Campaigns) · Tối đa 20MB / file · Auto parse sau khi
          upload
        </div>
        <input
          id="tiktok-file-input"
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          multiple
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {/* Recognized files */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(['tiktok_pgm', 'tiktok_lgm'] as TiktokFileType[]).map(type => {
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
                  fontFamily: 'var(--font-mono), "Be Vietnam Pro", monospace',
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
                fontFamily: 'var(--font-mono), "Be Vietnam Pro", monospace',
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
              onChange={e => assignPending(p.id, e.target.value as TiktokFileType)}
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
              <option value="tiktok_pgm">TikTok PGM</option>
              <option value="tiktok_lgm">TikTok LGM</option>
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

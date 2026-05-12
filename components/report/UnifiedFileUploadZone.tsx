'use client'

import { useCallback, useState, type DragEvent } from 'react'
import { Icon } from '@/lib/icons'
import {
  detectFileType,
  detectTiktokFileType,
  type ShopeeFileType,
  type TiktokFileType,
} from '@/lib/report/parsers'
import type { UploadedFiles } from './FileUploadZone'
import type { TiktokUploadedFiles } from './TiktokFileUploadZone'

type AnyFileType = ShopeeFileType | TiktokFileType

interface Props {
  shopeeFiles: UploadedFiles
  tiktokFiles: TiktokUploadedFiles
  onShopeeChange: (files: UploadedFiles) => void
  onTiktokChange: (files: TiktokUploadedFiles) => void
  onError: (msg: string) => void
  acceptShopee: boolean
  acceptTiktok: boolean
}

const MAX_BYTES = 20 * 1024 * 1024 // 20MB (TikTok PGM can be 4-8MB)

const SHOPEE_TYPES: ShopeeFileType[] = ['shopee_cpc', 'shopee_branding', 'shopee_live']
const TIKTOK_TYPES: TiktokFileType[] = ['tiktok_pgm', 'tiktok_lgm']

const LABEL: Record<AnyFileType, string> = {
  shopee_cpc: 'Shopee CPC',
  shopee_branding: 'Shopee Branding',
  shopee_live: 'Shopee Live',
  tiktok_pgm: 'TikTok PGM',
  tiktok_lgm: 'TikTok LGM',
}

const COLOR: Record<AnyFileType, string> = {
  shopee_cpc: '#3b82f6',
  shopee_branding: '#a855f7',
  shopee_live: '#f97316',
  tiktok_pgm: '#a855f7',
  tiktok_lgm: '#f97316',
}

function isShopeeType(t: AnyFileType): t is ShopeeFileType {
  return t === 'shopee_cpc' || t === 'shopee_branding' || t === 'shopee_live'
}

export default function UnifiedFileUploadZone({
  shopeeFiles,
  tiktokFiles,
  onShopeeChange,
  onTiktokChange,
  onError,
  acceptShopee,
  acceptTiktok,
}: Props) {
  const [drag, setDrag] = useState(false)
  const [pending, setPending] = useState<{ file: File; id: string }[]>([])

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming)
      const nextShopee = { ...shopeeFiles }
      const nextTiktok = { ...tiktokFiles }
      const newPending: { file: File; id: string }[] = []

      for (const f of list) {
        const isCsv = /\.csv$/i.test(f.name)
        const isXlsx = /\.xlsx?$/i.test(f.name)
        if (!isCsv && !isXlsx) {
          onError(`Chỉ hỗ trợ .csv (Shopee) hoặc .xlsx (TikTok) — bỏ qua "${f.name}"`)
          continue
        }
        if (f.size > MAX_BYTES) {
          onError(`File "${f.name}" quá lớn (>20MB), bỏ qua`)
          continue
        }

        // Try Shopee detect first (CSV files), then TikTok (xlsx)
        const shopeeT = isCsv ? detectFileType(f.name) : null
        const tiktokT = !shopeeT ? detectTiktokFileType(f.name) : null

        if (shopeeT) {
          if (!acceptShopee) {
            onError(`Shopee không được chọn ở Bước 1 — bỏ qua "${f.name}"`)
            continue
          }
          if (nextShopee[shopeeT]) onError(`Đã thay thế file ${LABEL[shopeeT]} cũ`)
          nextShopee[shopeeT] = f
        } else if (tiktokT) {
          if (!acceptTiktok) {
            onError(`TikTok không được chọn ở Bước 1 — bỏ qua "${f.name}"`)
            continue
          }
          if (nextTiktok[tiktokT]) onError(`Đã thay thế file ${LABEL[tiktokT]} cũ`)
          nextTiktok[tiktokT] = f
        } else {
          newPending.push({ file: f, id: `${f.name}-${Date.now()}-${Math.random()}` })
        }
      }

      if (newPending.length > 0) {
        setPending(p => [...p, ...newPending])
        onError(`${newPending.length} file không nhận diện được — chọn loại bên dưới`)
      }
      onShopeeChange(nextShopee)
      onTiktokChange(nextTiktok)
    },
    [shopeeFiles, tiktokFiles, onShopeeChange, onTiktokChange, onError, acceptShopee, acceptTiktok],
  )

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDrag(false)
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }

  function removeShopee(type: ShopeeFileType) {
    onShopeeChange({ ...shopeeFiles, [type]: null })
  }
  function removeTiktok(type: TiktokFileType) {
    onTiktokChange({ ...tiktokFiles, [type]: null })
  }
  function assignPending(id: string, type: AnyFileType) {
    const entry = pending.find(p => p.id === id)
    if (!entry) return
    if (isShopeeType(type)) {
      if (shopeeFiles[type]) onError(`Đã thay thế file ${LABEL[type]} cũ`)
      onShopeeChange({ ...shopeeFiles, [type]: entry.file })
    } else {
      if (tiktokFiles[type]) onError(`Đã thay thế file ${LABEL[type]} cũ`)
      onTiktokChange({ ...tiktokFiles, [type]: entry.file })
    }
    setPending(p => p.filter(x => x.id !== id))
  }
  function discardPending(id: string) {
    setPending(p => p.filter(x => x.id !== id))
  }

  const shopeeCount = SHOPEE_TYPES.filter(t => shopeeFiles[t]).length
  const tiktokCount = TIKTOK_TYPES.filter(t => tiktokFiles[t]).length
  const total = shopeeCount + tiktokCount

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
        onClick={() => document.getElementById('unified-file-input')?.click()}
      >
        <div style={{ display: 'inline-flex', color: '#60a5fa', marginBottom: 10 }}>{Icon.send(28)}</div>
        <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
          {total === 0
            ? 'Kéo thả tất cả file vào đây hoặc click để chọn'
            : `Đã có ${total} file — kéo thêm hoặc thay thế`}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          Auto-detect: Shopee CSV (CPC / Branding / Livestream) + TikTok xlsx (PGM / LGM)
          {' · '}Tối đa 20MB / file · Auto parse sau khi upload
        </div>
        <input
          id="unified-file-input"
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          multiple
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {/* Recognized files — Shopee */}
      {acceptShopee && shopeeCount > 0 && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Shopee · {shopeeCount}/3
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SHOPEE_TYPES.map(type => {
              const f = shopeeFiles[type]
              if (!f) return null
              return (
                <FilePill
                  key={type}
                  label={LABEL[type]}
                  color={COLOR[type]}
                  file={f}
                  onRemove={() => removeShopee(type)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Recognized files — TikTok */}
      {acceptTiktok && tiktokCount > 0 && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            TikTok · {tiktokCount}/2
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TIKTOK_TYPES.map(type => {
              const f = tiktokFiles[type]
              if (!f) return null
              return (
                <FilePill
                  key={type}
                  label={LABEL[type]}
                  color={COLOR[type]}
                  file={f}
                  onRemove={() => removeTiktok(type)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Pending — unrecognized */}
      {pending.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#fbbf24',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Chưa nhận diện · {pending.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                  onChange={e => assignPending(p.id, e.target.value as AnyFileType)}
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
                    — Loại —
                  </option>
                  {acceptShopee && <option value="shopee_cpc">Shopee CPC</option>}
                  {acceptShopee && <option value="shopee_branding">Shopee Branding</option>}
                  {acceptShopee && <option value="shopee_live">Shopee Live</option>}
                  {acceptTiktok && <option value="tiktok_pgm">TikTok PGM</option>}
                  {acceptTiktok && <option value="tiktok_lgm">TikTok LGM</option>}
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
      )}
    </div>
  )
}

function FilePill({
  label,
  color,
  file,
  onRemove,
}: {
  label: string
  color: string
  file: File
  onRemove: () => void
}) {
  return (
    <div
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
          background: color,
          color: '#fff',
          borderRadius: 5,
        }}
      >
        {label}
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
        {file.name}
      </span>
      <span style={{ color: '#94a3b8', fontSize: 11 }}>{(file.size / 1024).toFixed(1)} KB</span>
      <button
        type="button"
        onClick={onRemove}
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
}

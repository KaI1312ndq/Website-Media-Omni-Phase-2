'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type SopCard = {
  _id: string
  title: string
  slug: { current: string }
  category: string
  platform?: string[]
  level?: string
  excerpt: string
  icon?: string
  pinned?: boolean
  tags?: string[]
  author?: string
  publishedAt?: string
}

const CATEGORY_LABEL: Record<string, string> = {
  process: 'Quy trình',
  template: 'Templates',
  checklist: 'Checklists',
  training: 'Training',
  playbook: 'Playbook',
  tools: 'Tools',
}

const CATEGORIES = ['all', 'process', 'template', 'checklist', 'training', 'playbook', 'tools']
const PLATFORMS = ['all', 'shopee', 'tiktok', 'meta', 'google', 'general']
const LEVELS = ['all', 'beginner', 'intermediate', 'advanced']

const PLAT_LABEL: Record<string, string> = {
  all: 'Tất cả', shopee: 'Shopee', tiktok: 'TikTok', meta: 'Meta', google: 'Google', general: 'General',
}
const LEVEL_LABEL: Record<string, string> = {
  all: 'Tất cả', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced',
}

export default function SopHubClient({ docs }: { docs: SopCard[] }) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [plat, setPlat] = useState('all')
  const [level, setLevel] = useState('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs.filter(d => {
      if (cat !== 'all' && d.category !== cat) return false
      if (plat !== 'all' && !(d.platform || []).includes(plat)) return false
      if (level !== 'all' && d.level !== level) return false
      if (q) {
        const hay = [d.title, d.excerpt, ...(d.tags || [])].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [docs, search, cat, plat, level])

  const pinned = filtered.filter(d => d.pinned)
  const rest = filtered.filter(d => !d.pinned)

  return (
    <div className="sop-wrap">
      <div className="sop-hero">
        <h1>SOP & Resources</h1>
        <p>Tài liệu nội bộ — quy trình, templates, checklists, training & playbook cho team Media Omni.</p>
      </div>

      <div className="sop-toolbar">
        <input
          className="sop-search"
          type="search"
          placeholder="Tìm kiếm theo tiêu đề, mô tả, tag…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="sop-chips">
        <span className="sop-chips-label">Danh mục</span>
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`sop-chip${cat === c ? ' active' : ''}`}
            onClick={() => setCat(c)}
          >{c === 'all' ? 'Tất cả' : CATEGORY_LABEL[c] ?? c}</button>
        ))}
      </div>
      <div className="sop-chips">
        <span className="sop-chips-label">Platform</span>
        {PLATFORMS.map(p => (
          <button key={p} className={`sop-chip${plat === p ? ' active' : ''}`} onClick={() => setPlat(p)}>
            {PLAT_LABEL[p]}
          </button>
        ))}
      </div>
      <div className="sop-chips">
        <span className="sop-chips-label">Cấp độ</span>
        {LEVELS.map(l => (
          <button key={l} className={`sop-chip${level === l ? ' active' : ''}`} onClick={() => setLevel(l)}>
            {LEVEL_LABEL[l]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="sop-empty">
          <div className="sop-empty-icon">📭</div>
          <p><b>Chưa có tài liệu nào khớp filter.</b></p>
          <p>Thử bỏ filter, hoặc thêm SOP mới qua Sanity Studio.</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <>
              <div className="sop-section-title">📌 Pinned</div>
              <div className="sop-grid">
                {pinned.map(d => <Card key={d._id} d={d} />)}
              </div>
            </>
          )}
          {rest.length > 0 && (
            <>
              <div className="sop-section-title">Tất cả tài liệu ({rest.length})</div>
              <div className="sop-grid">
                {rest.map(d => <Card key={d._id} d={d} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function Card({ d }: { d: SopCard }) {
  return (
    <Link href={`/hub/sop/${d.slug.current}`} className={`sop-card${d.pinned ? ' pinned' : ''}`}>
      {d.pinned && <span className="sop-pin-badge">PINNED</span>}
      <div className="sop-card-icon">{d.icon || '📋'}</div>
      <div className="sop-card-title">{d.title}</div>
      <div className="sop-card-excerpt">{d.excerpt}</div>
      <div className="sop-card-foot">
        <span className="sop-cat-badge">{CATEGORY_LABEL[d.category] ?? d.category}</span>
        {d.level && <span className={`sop-level-pill ${d.level}`}>{d.level}</span>}
        {(d.platform || []).slice(0, 3).map(p => (
          <span key={p} className="sop-plat-tag">{p}</span>
        ))}
      </div>
    </Link>
  )
}

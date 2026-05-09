'use client'

import { useRef, useState } from 'react'
import { SessionUser, initials, setSession } from '@/lib/auth'

interface Props {
  user: SessionUser
  onClose: () => void
  onUpdate?: (u: SessionUser) => void
}

export default function ProfileModal({ user, onClose, onUpdate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(user.avatar_url)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confPw, setConfPw] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) {
      showToast('err', 'File quá 5MB')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const r = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Upload thất bại')
      setAvatarUrl(j.url)
      const updated: SessionUser = { ...user, avatar_url: j.url }
      setSession(updated)
      onUpdate?.(updated)
      showToast('ok', j.synced_to_sanity
        ? 'Đã cập nhật avatar (đồng bộ với homepage)'
        : 'Đã cập nhật avatar (chưa có team member match trong Sanity)')
    } catch (err: any) {
      showToast('err', err?.message || 'Upload lỗi')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confPw) {
      showToast('err', 'Xác nhận mật khẩu không khớp')
      return
    }
    if (newPw.length < 6) {
      showToast('err', 'Mật khẩu mới phải ít nhất 6 ký tự')
      return
    }
    setSavingPw(true)
    try {
      const r = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Đổi mật khẩu thất bại')
      setCurPw(''); setNewPw(''); setConfPw('')
      showToast('ok', 'Đã đổi mật khẩu')
    } catch (err: any) {
      showToast('err', err?.message || 'Đổi mật khẩu lỗi')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose} aria-label="Đóng">✕</button>
        <div className="pm-header">
          <div className="pm-avatar-wrap" onClick={() => fileRef.current?.click()} title="Đổi ảnh đại diện">
            {avatarUrl
              ? <img src={avatarUrl} alt={user.name} className="pm-avatar-img" />
              : <div className="pm-avatar-init">{initials(user.name)}</div>}
            <div className="pm-avatar-overlay">{uploading ? 'Đang tải...' : '📷 Đổi ảnh'}</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          <h2 className="pm-name">{user.name}</h2>
          <div className="pm-meta">
            <span className="pm-username">@{user.username}</span>
            <span className={`pm-role pm-role-${user.role}`}>{user.role}</span>
          </div>
        </div>

        <form className="pm-section" onSubmit={handlePasswordChange}>
          <h3>Đổi mật khẩu</h3>
          <label className="pm-field">
            <span>Mật khẩu hiện tại</span>
            <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} required />
          </label>
          <label className="pm-field">
            <span>Mật khẩu mới (≥ 6 ký tự)</span>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} minLength={6} required />
          </label>
          <label className="pm-field">
            <span>Xác nhận mật khẩu mới</span>
            <input type="password" value={confPw} onChange={e => setConfPw(e.target.value)} minLength={6} required />
          </label>
          <button type="submit" className="pm-submit" disabled={savingPw}>
            {savingPw ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </form>

        {toast && (
          <div className={`pm-toast pm-toast-${toast.type}`}>{toast.msg}</div>
        )}
      </div>
    </div>
  )
}

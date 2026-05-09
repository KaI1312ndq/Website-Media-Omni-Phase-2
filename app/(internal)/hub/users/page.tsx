'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, SessionUser, initials, ROLE_DEFAULTS } from '@/lib/auth'
import { HubPageSkeleton } from '@/components/Skeleton'
import '@/app/(internal)/dashboard/dashboard.css'

type UserRow = { id: string; username: string; name: string; role: string; status: string; perms: Record<string, number> }
type BrandAssign = { id: string; brand_name: string; assigned_members: string; isAll: boolean; included: boolean }

const PERMS_DEF = [
  { section: 'Quiz & Learning', items: [
    { key: 'quiz_view',  ico: '📝', name: 'Quiz Hub',      desc: 'Làm bài kiểm tra kiến thức' },
    { key: 'quiz_score', ico: '📊', name: 'Xem điểm team', desc: 'Xem bảng điểm tất cả thành viên' },
  ]},
  { section: 'Daily Tasks', items: [
    { key: 'tasks_view',   ico: '📅', name: 'Xem task',  desc: 'Xem task được assign' },
    { key: 'tasks_create', ico: '➕', name: 'Tạo task',  desc: 'Tạo và assign task cho người khác' },
  ]},
  { section: 'Blog & Content', items: [
    { key: 'blog_view',    ico: '📖', name: 'Xem blog',  desc: 'Đọc bài viết nội bộ' },
    { key: 'blog_write',   ico: '✏️', name: 'Viết bài',  desc: 'Tạo và chỉnh sửa bài viết' },
    { key: 'blog_publish', ico: '🚀', name: 'Publish',   desc: 'Xuất bản bài viết công khai' },
    { key: 'blog_delete',  ico: '🗑️', name: 'Xóa bài',   desc: 'Xóa bài viết đã đăng' },
  ]},
  { section: 'Quản trị', items: [
    { key: 'admin_users',  ico: '👥', name: 'Quản lý tài khoản', desc: 'Tạo, sửa, phân quyền user', locked: true },
    { key: 'admin_scores', ico: '📈', name: 'Analytics',         desc: 'Thống kê toàn team',         locked: true },
  ]},
]

export default function UsersPage() {
  const router = useRouter()
  const [me, setMe] = useState<SessionUser | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [curPerms, setCurPerms] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'member', status: 'active' })
  const [saving, setSaving] = useState(false)
  const [newPass, setNewPass] = useState('')
  const [cfmPass, setCfmPass] = useState('')
  const [toast, setToast] = useState<{ msg: string; type?: string } | null>(null)
  const [brands, setBrands] = useState<BrandAssign[]>([])
  const [brandSel, setBrandSel] = useState<Set<string>>(new Set())
  const [brandsLoading, setBrandsLoading] = useState(false)
  const [savingBrands, setSavingBrands] = useState(false)

  function showToast(msg: string, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    const u = getSession()
    if (!u) return
    if (u.role !== 'admin') { router.push('/dashboard'); return }
    setMe(u); loadUsers()
  }, [router])

  async function loadUsers() {
    const j = await fetch('/api/users').then(r => r.json())
    setUsers(j.users || [])
  }

  function selectUser(u: UserRow) {
    setSelected(u)
    setCurPerms(u.perms && Object.keys(u.perms).length > 0 ? u.perms : { ...ROLE_DEFAULTS[u.role as keyof typeof ROLE_DEFAULTS] })
    loadBrandAssign(u.username)
  }

  async function loadBrandAssign(username: string) {
    setBrandsLoading(true)
    try {
      const j = await fetch(`/api/brands/assign?username=${encodeURIComponent(username)}`).then(r => r.json())
      const list: BrandAssign[] = j.brands || []
      setBrands(list)
      // Include cả 'all' brands trong selection (hiện tích sẵn, có thể uncheck để revoke)
      setBrandSel(new Set(list.filter(b => b.included).map(b => b.id)))
    } catch {
      setBrands([]); setBrandSel(new Set())
    } finally {
      setBrandsLoading(false)
    }
  }

  function toggleBrand(id: string) {
    setBrandSel(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  function selectAllBrands() {
    setBrandSel(new Set(brands.map(b => b.id)))
  }

  function clearAllBrands() {
    setBrandSel(new Set())
  }

  async function saveBrandAssign() {
    if (!selected) return
    setSavingBrands(true)
    try {
      const r = await fetch('/api/brands/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selected.username, brand_ids: Array.from(brandSel) }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Lỗi lưu phân quyền brand')
      await loadBrandAssign(selected.username)
      showToast('✅ Đã lưu phân quyền brand!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Lỗi'
      showToast(msg, 'error')
    } finally {
      setSavingBrands(false)
    }
  }

  const filtered = users.filter(u => {
    const roleOk = filter === 'ALL' || u.role === filter
    const q = search.toLowerCase()
    const searchOk = !q || u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)
    return roleOk && searchOk
  })

  async function savePerms() {
    if (!selected) return
    setSaving(true)
    await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', username: selected.username, role: selected.role, perms: curPerms }) })
    await loadUsers()
    showToast('✅ Đã lưu phân quyền!')
    setSaving(false)
  }

  async function resetPass() {
    if (!newPass || newPass.length < 6) { showToast('Mật khẩu tối thiểu 6 ký tự', 'error'); return }
    if (newPass !== cfmPass) { showToast('Mật khẩu xác nhận không khớp', 'error'); return }
    await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', username: selected?.username, password: newPass }) })
    showToast('✅ Đã đặt lại mật khẩu!'); setNewPass(''); setCfmPass('')
  }

  async function toggleStatus() {
    if (!selected) return
    const ns = selected.status === 'disabled' ? 'active' : 'disabled'
    await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', username: selected.username, status: ns }) })
    setSelected({ ...selected, status: ns })
    await loadUsers(); showToast('✅ Đã cập nhật')
  }

  async function deleteUser() {
    if (!selected || !confirm(`Xóa vĩnh viễn @${selected.username}?`)) return
    await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', username: selected.username }) })
    setSelected(null); await loadUsers(); showToast('✅ Đã xóa')
  }

  async function saveUser() {
    if (!form.name || !form.username) { showToast('Vui lòng nhập đủ thông tin', 'error'); return }
    if (!editing && !form.password) { showToast('Vui lòng nhập mật khẩu', 'error'); return }
    setSaving(true)
    if (editing) {
      await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', username: form.username, name: form.name, role: form.role, status: form.status, ...(form.password ? { password: form.password } : {}) }) })
      showToast('✅ Đã cập nhật!')
    } else {
      await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', username: form.username, name: form.name, password: form.password, role: form.role, status: form.status, perms: ROLE_DEFAULTS[form.role as keyof typeof ROLE_DEFAULTS] }) })
      showToast('✅ Đã tạo tài khoản mới!')
    }
    setModal(false); setEditing(null); setSaving(false); await loadUsers()
  }

  function openCreate() {
    setEditing(null)
    setForm({ name: '', username: '', password: '', role: 'member', status: 'active' })
    setModal(true)
  }

  function openEdit(u: UserRow) {
    setEditing(u.username)
    setForm({ name: u.name, username: u.username, password: '', role: u.role, status: u.status })
    setModal(true)
  }

  const avCls = (role: string) => role === 'admin' ? 'av-admin' : role === 'upbase' ? 'av-upbase' : 'av-member'

  if (!me) {
    return <HubPageSkeleton title="Đang tải users..." />
  }

  return (
    <>
      {toast && <div className={`toast show ${toast.type || 'success'}`} style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}><div className="toast-dot" /><span>{toast.msg}</span></div>}

      {modal && (
        <div className="um-modal-overlay open" onClick={() => setModal(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-hdr">
              <h3>{editing ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}</h3>
              <button className="um-modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="fp-grid">
              <div className="fp-full"><label className="fp-label">Họ và tên *</label><input className="fp-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nguyễn Văn A" /></div>
              <div><label className="fp-label">Username *</label><input className="fp-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="nguyenvana" disabled={!!editing} /></div>
              <div><label className="fp-label">Mật khẩu{editing ? ' (để trống = giữ nguyên)' : ' *'}</label><input className="fp-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mật khẩu" /></div>
              <div><label className="fp-label">Role</label>
                <select className="fp-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="member">Member</option><option value="admin">Admin</option><option value="upbase">UpBase</option>
                </select>
              </div>
              <div><label className="fp-label">Trạng thái</label>
                <select className="fp-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option><option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
            <div className="fp-actions">
              <button className="fp-cancel" onClick={() => setModal(false)}>Huỷ</button>
              <button className="fp-submit" onClick={saveUser} disabled={saving}>{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi →' : 'Tạo tài khoản →'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="users-wrap" style={{ paddingTop: 0 }}>
        <div className="users-hdr" style={{ justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={openCreate}>＋ Tạo tài khoản</button>
        </div>

        <div className="um-layout">
          <div className="um-left">
            <div className="um-search-wrap">
              {/* Honeypot fields absorb browser autofill attempts */}
              <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} tabIndex={-1} aria-hidden />
              <input type="password" name="password" autoComplete="current-password" style={{ display: 'none' }} tabIndex={-1} aria-hidden />
              <input
                className="um-search"
                type="text"
                name={`member-search-${Math.random().toString(36).slice(2, 8)}`}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                placeholder="Tìm thành viên..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="um-filter-row">
              {['ALL','admin','member','upbase'].map(r => (
                <button key={r} className={`umf${filter === r ? ' active' : ''}`} onClick={() => setFilter(r)}>{r === 'ALL' ? 'Tất cả' : r.charAt(0).toUpperCase() + r.slice(1)}</button>
              ))}
            </div>
            <div className="um-user-list">
              {filtered.length === 0 ? <div className="um-loading">Không tìm thấy.</div> : filtered.map(u => (
                <div key={u.username} className={`um-user-item${selected?.username === u.username ? ' active' : ''}`} onClick={() => selectUser(u)}>
                  <div className={`um-av ${avCls(u.role)}`}>{initials(u.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="um-ui-name">{u.name}</div>
                    <div className="um-ui-user">@{u.username}</div>
                  </div>
                  <span className={`um-ui-badge uib-${u.status === 'disabled' ? 'disabled' : u.role}`}>{u.status === 'disabled' ? 'OFF' : u.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="um-right">
            {!selected ? (
              <div className="um-empty-state"><div className="ue-ico">👆</div><div className="ue-title">Chọn thành viên</div><div className="ue-sub">Nhấn vào tên bên trái để xem và chỉnh sửa quyền</div></div>
            ) : (
              <div className="um-detail">
                <div className="um-detail-hdr">
                  <div className={`um-detail-av ${avCls(selected.role)}`}>{initials(selected.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="um-detail-name">{selected.name}</div>
                    <div className="um-detail-meta">
                      <span className="um-detail-username">@{selected.username}</span>
                      <span className={`role-pill rp-${selected.role}`}>{selected.role}</span>
                      <span className={`role-pill sp-${selected.status === 'disabled' ? 'disabled' : 'active'}`}>{selected.status === 'disabled' ? 'Disabled' : 'Active'}</span>
                    </div>
                  </div>
                  <div className="um-detail-actions">
                    <button className="ud-btn" onClick={() => openEdit(selected)}>✏️ Sửa</button>
                    <button className="ud-btn ud-btn-danger" onClick={toggleStatus}>{selected.status === 'disabled' ? 'Bật' : 'Tắt'}</button>
                    {selected.username !== me?.username && <button className="ud-btn ud-btn-danger" onClick={deleteUser}>Xóa</button>}
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--faint)', marginBottom: 10 }}>Role</div>
                <div className="role-selector" style={{ marginBottom: 24, display: 'flex', gap: 10 }}>
                  {(['admin','member','upbase'] as const).map(r => (
                    <div key={r} className={`role-opt${selected.role === r ? ' selected-' + r : ''}`} onClick={() => { setSelected({ ...selected, role: r }); setCurPerms({ ...ROLE_DEFAULTS[r] }) }}>
                      <div className="ro-ico">{r === 'admin' ? '👑' : r === 'member' ? '⚡' : '🏢'}</div>
                      <div className="ro-name" style={{ color: r === 'admin' ? 'var(--error)' : r === 'member' ? 'var(--blue)' : 'var(--success)' }}>{r}</div>
                      <div className="ro-desc">{r === 'admin' ? 'Toàn quyền' : r === 'member' ? 'Truy cập cơ bản' : 'Xem quiz'}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--faint)', marginBottom: 14 }}>Phân quyền tính năng</div>
                {PERMS_DEF.map(sec => (
                  <div key={sec.section} className="perm-section">
                    <div className="perm-section-title">{sec.section}</div>
                    <div className="perm-grid">
                      {sec.items.map(p => (
                        <div key={p.key} className={`perm-item${curPerms[p.key] ? ' checked' : ''}${'locked' in p && p.locked ? ' locked' : ''}`}
                          onClick={() => !('locked' in p && p.locked) && setCurPerms(cp => ({ ...cp, [p.key]: cp[p.key] ? 0 : 1 }))}>
                          <div className="perm-checkbox" />
                          <div style={{ flex: 1 }}>
                            <div className="perm-name">{p.ico} {p.name}</div>
                            <div className="perm-desc">{p.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--faint)', marginBottom: 6, marginTop: 8 }}>Brand Assignment</div>
                <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 14 }}>Chọn brands user này được phép xem trong Report Tool & Analytics</div>

                {(selected.role === 'admin' || (selected.role as string) === 'lead') ? (
                  <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', color: 'var(--muted)', fontStyle: 'italic', fontSize: '.85rem', marginBottom: 22 }}>
                    👑 Admin/Lead — thấy tất cả brands
                  </div>
                ) : (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      <button type="button" className="ud-btn" onClick={selectAllBrands}>Tất cả</button>
                      <button type="button" className="ud-btn" onClick={clearAllBrands}>Bỏ chọn</button>
                      <button type="button" className="ud-btn ud-btn-primary" onClick={saveBrandAssign} disabled={savingBrands}>{savingBrands ? 'Đang lưu...' : '💾 Lưu phân quyền brand'}</button>
                    </div>

                    {brandsLoading ? (
                      <div style={{ color: 'var(--faint)', fontSize: '.8rem' }}>Đang tải brands...</div>
                    ) : brands.length === 0 ? (
                      <div style={{ color: 'var(--faint)', fontSize: '.8rem' }}>Chưa có brand nào.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                        {brands.map(b => {
                          const checked = brandSel.has(b.id)
                          const isAllOriginal = b.isAll
                          return (
                            <div key={b.id} onClick={() => toggleBrand(b.id)}
                              title={isAllOriginal ? 'Đang mở cho TẤT CẢ — uncheck để revoke quyền user này' : undefined}
                              style={{ cursor: 'pointer', padding: '10px 12px', borderRadius: 8,
                                background: checked ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${checked ? 'rgba(37,99,235,0.6)' : 'rgba(255,255,255,0.08)'}`,
                                display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem',
                                transition: 'background .15s, border-color .15s' }}>
                              <span style={{ width: 14, height: 14, borderRadius: 3, border: '1.5px solid rgba(255,255,255,0.4)', background: checked ? '#2563eb' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', fontSize: 10, color: '#fff' }}>{checked ? '✓' : ''}</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{b.brand_name}</span>
                              {isAllOriginal && checked && (
                                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '.55rem', padding: '2px 5px', borderRadius: 3, background: 'rgba(34,197,94,0.15)', color: '#34d399', flex: '0 0 auto' }}>ALL</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="pass-section">
                  <h4>🔑 Đặt lại mật khẩu</h4>
                  <div className="pass-grid">
                    <div><label className="fp-label">Mật khẩu mới</label><input className="fp-input" type="password" autoComplete="new-password" data-lpignore="true" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Tối thiểu 6 ký tự" /></div>
                    <div><label className="fp-label">Xác nhận</label><input className="fp-input" type="password" autoComplete="new-password" data-lpignore="true" value={cfmPass} onChange={e => setCfmPass(e.target.value)} placeholder="Nhập lại mật khẩu" /></div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}><button className="pass-save-btn" onClick={resetPass}>Đặt lại mật khẩu</button></div>
                  </div>
                </div>

                <div className="save-bar">
                  <span>Nhấn lưu để áp dụng thay đổi quyền</span>
                  <button className="ud-btn ud-btn-primary" onClick={savePerms} disabled={saving}>{saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

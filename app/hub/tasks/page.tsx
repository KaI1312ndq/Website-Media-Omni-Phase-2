'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, setSession, clearSession, SessionUser, initials } from '@/lib/auth'
import { HubPageSkeleton } from '@/components/Skeleton'
import InternalLayout from '@/components/InternalLayout'
import '@/app/dashboard/dashboard.css'

type Task = {
  id: string; task_name: string; description?: string
  assignee: string; assignee_name?: string
  date: string; time_start?: string; time_end?: string
  priority: 'high' | 'medium' | 'low'; status: 'todo' | 'done'
  created_by?: string; created_name?: string
}

type UserRow = { username: string; name: string; role: string }

const PRI_LABEL = { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }
const PRI_CLS   = { high: 'pri-high', medium: 'pri-medium', low: 'pri-low' }
const CARD_CLS  = { high: 'tc-high', medium: 'tc-medium', low: 'tc-low' }
const DOT_CLR   = { high: 'var(--error)', medium: 'var(--warning)', low: 'var(--success)' }
const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const fmtShort = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
const fmtTime = (v?: string) => {
  if (!v) return ''
  const [h, m] = v.split(':')
  return `${h.padStart(2,'0')}:${m.padStart(2,'0')}`
}

export default function TasksPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [tab, setTab] = useState<'myday'|'team'|'create'>('myday')
  const [curDate, setCurDate] = useState(new Date())
  const [weekOff, setWeekOff] = useState(0)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<UserRow[]>([])
  const [popup, setPopup] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ task_name: '', description: '', assignee: '', date: fmt(new Date()), time_start: '09:00', time_end: '10:00', priority: 'medium' })
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type?: string } | null>(null)

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let u = getSession()
    if (!u) { router.push('/'); return }
    fetch('/api/auth').then(r => r.json()).then(({ user: su }) => {
      if (su) { setSession(su); setUser(su); setForm(f => ({ ...f, assignee: su.username })) }
      else if (u) { setUser(u); setForm(f => ({ ...f, assignee: u!.username })) }
      else router.push('/')
    })
    fetch('/api/users').then(r => r.json()).then(({ users }) => {
      setMembers((users || []).filter((x: UserRow) => x.role !== 'upbase'))
    })
  }, [router])

  const loadMyDay = useCallback(async (date: Date) => {
    if (!user) return
    setLoading(true)
    const j = await fetch(`/api/tasks?assignee=${user.username}&date=${fmt(date)}`).then(r => r.json())
    setTodayTasks(j.data || [])
    setLoading(false)
  }, [user])

  const loadTeamCal = useCallback(async () => {
    setLoading(true)
    const dates = getWeekDates(weekOff)
    const ws = fmt(dates[0]); const we = fmt(dates[4])
    const j = await fetch(`/api/tasks?week_start=${ws}&week_end=${we}`).then(r => r.json())
    setAllTasks(j.data || [])
    setLoading(false)
  }, [weekOff])

  useEffect(() => { if (user && tab === 'myday') loadMyDay(curDate) }, [user, tab, curDate, loadMyDay])
  useEffect(() => { if (user && tab === 'team') loadTeamCal() }, [user, tab, weekOff, loadTeamCal])

  function getWeekDates(off = 0) {
    const now = new Date(); const day = now.getDay()
    const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7) + off * 7)
    return Array.from({ length: 5 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
  }

  async function toggleTask(id: string, done: boolean) {
    const newStatus = done ? 'todo' : 'done'
    await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id, status: newStatus }) })
    setTodayTasks(ts => ts.map(t => t.id === id ? { ...t, status: newStatus } : t))
    showToast(newStatus === 'done' ? '✅ Đã hoàn thành!' : '↩ Đã mở lại task')
  }

  async function createTask() {
    if (!form.task_name.trim()) { showToast('Vui lòng nhập tên task', 'error'); return }
    if (!form.assignee) { showToast('Chọn người được assign', 'error'); return }
    setCreating(true)
    const assigneeMember = members.find(m => m.username === form.assignee)
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, assignee_name: assigneeMember?.name, created_by: user?.username, created_name: user?.name }),
    })
    showToast('✅ Task đã được tạo!')
    setForm(f => ({ ...f, task_name: '', description: '' }))
    setCreating(false)
    setTimeout(() => setTab('myday'), 1200)
  }

  const done = todayTasks.filter(t => t.status === 'done').length
  const pct  = todayTasks.length > 0 ? Math.round(done / todayTasks.length * 100) : 0
  const circleOffset = 251 - (251 * pct / 100)

  const weekDates = getWeekDates(weekOff)

  async function logout() {
    try { await fetch('/api/auth', { method: 'DELETE' }) } catch {}
    clearSession()
    router.push('/')
  }

  if (!user) {
    return <HubPageSkeleton title="Đang tải tasks..." />
  }

  return (
    <InternalLayout user={user} onLogout={logout} greeting="Daily Tasks" subline="Quản lý task hàng ngày của bạn và team.">
      {toast && (
        <div className={`toast show ${toast.type || 'success'}`} style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <div className="toast-dot" /><span>{toast.msg}</span>
        </div>
      )}
      {popup && (
        <div className="popup-overlay on" onClick={() => setPopup(null)}>
          <div className="popup-card" onClick={e => e.stopPropagation()}>
            <div className="popup-title">{popup.task_name}</div>
            <div className="popup-row"><span className="popup-lbl">Assignee</span><span className="popup-val">{popup.assignee_name || popup.assignee}</span></div>
            <div className="popup-row"><span className="popup-lbl">Thời gian</span><span className="popup-val">{popup.time_start ? `${fmtTime(popup.time_start)}${popup.time_end ? ' – ' + fmtTime(popup.time_end) : ''}` : 'Không có giờ'}</span></div>
            <div className="popup-row"><span className="popup-lbl">Ưu tiên</span><span className="popup-val">{PRI_LABEL[popup.priority]}</span></div>
            <div className="popup-row"><span className="popup-lbl">Tạo bởi</span><span className="popup-val">{popup.created_name || '—'}</span></div>
            {popup.description && <div className="popup-row"><span className="popup-lbl">Mô tả</span><span className="popup-val">{popup.description}</span></div>}
            <button className="popup-close" onClick={() => setPopup(null)}>Đóng</button>
          </div>
        </div>
      )}

      <div className="il-paper">
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <button className={`btn-${tab === 'myday' ? 'p' : 's'}`} onClick={() => setTab('myday')}>📅 My Day</button>
        <button className={`btn-${tab === 'team' ? 'p' : 's'}`} onClick={() => setTab('team')}>👥 Team</button>
        {(user?.role === 'admin' || user?.perms?.tasks_create) && (
          <button className={`btn-${tab === 'create' ? 'p' : 's'}`} onClick={() => setTab('create')}>➕ Tạo task</button>
        )}
      </div>

      {/* MY DAY */}
      {tab === 'myday' && (
        <div className="rw" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 0 40px'}}>
          <div className="date-bar">
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '1.6rem', fontWeight: 800 }}>My Day — <span>{DAYS[curDate.getDay()]}</span></h1>
            <div className="date-nav">
              <button className="date-btn" onClick={() => setCurDate(d => { const n=new Date(d); n.setDate(n.getDate()-1); return n })}>←</button>
              <span className="date-label">{fmtShort(curDate)} / {curDate.getFullYear()}</span>
              <button className="date-btn" onClick={() => setCurDate(d => { const n=new Date(d); n.setDate(n.getDate()+1); return n })}>→</button>
              <button className="date-today-btn" onClick={() => setCurDate(new Date())}>Hôm nay</button>
            </div>
          </div>

          <div className="myday-grid">
            <div className="timeline-card">
              <div className="tl-head">
                <span className="tl-title">Timeline trong ngày</span>
                <span className="tl-count">{todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="tl-body">
                {loading ? <div className="t-loading">⏳ Đang tải...</div> : todayTasks.length === 0 ? (
                  <div className="t-empty"><div className="t-empty-ico">📭</div><div className="t-empty-tt">Không có task nào</div><div className="t-empty-sb">Hôm nay chưa có task được assign cho bạn.</div></div>
                ) : (() => {
                  const hours = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
                  const noTime = todayTasks.filter(t => !t.time_start)
                  return <>
                    {noTime.length > 0 && <>
                      <div style={{ padding: '6px 16px 4px', fontFamily: 'var(--f-mono)', fontSize: '.62rem', fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Không có giờ cụ thể</div>
                      {noTime.map(t => <TaskCard key={t.id} t={t} onToggle={toggleTask} onDetail={setPopup} />)}
                      <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
                    </>}
                    {hours.map(h => {
                      const slot = todayTasks.filter(t => t.time_start && fmtTime(t.time_start) === h)
                      return (
                        <div key={h} className="tl-slot">
                          <div className="tl-time">{h}</div>
                          <div className="tl-line" />
                          <div className="tl-tasks">
                            {slot.length ? slot.map(t => <TaskCard key={t.id} t={t} onToggle={toggleTask} onDetail={setPopup} />) : <div className="tl-empty">Trống</div>}
                          </div>
                        </div>
                      )
                    })}
                  </>
                })()}
              </div>
            </div>

            <div className="t-sidebar">
              <div className="t-scard">
                <div className="t-scard-title">Tiến độ hôm nay</div>
                <div className="prog-ring">
                  <div className="pr-wrap">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="8"/>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--blue)" strokeWidth="8" strokeDasharray="251" strokeDashoffset={circleOffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s' }}/>
                    </svg>
                    <div className="pr-txt"><div className="pr-pct">{pct}%</div><div className="pr-lbl">Hoàn thành</div></div>
                  </div>
                </div>
                <div className="stat-2">
                  <div className="stat-cell"><div className="stat-v">{done}</div><div className="stat-l">Xong</div></div>
                  <div className="stat-cell"><div className="stat-v">{todayTasks.length - done}</div><div className="stat-l">Còn lại</div></div>
                </div>
              </div>
              <div className="t-scard">
                <div className="t-scard-title">Sắp tới hôm nay</div>
                {(() => {
                  const now = new Date()
                  const nowStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
                  const upcoming = todayTasks.filter(t => t.status !== 'done' && t.time_start && fmtTime(t.time_start) >= nowStr).slice(0, 5)
                  return upcoming.length ? upcoming.map(t => (
                    <div key={t.id} className="up-item">
                      <div className="up-dot" style={{ background: DOT_CLR[t.priority] }} />
                      <div className="up-name">{t.task_name}</div>
                      <div className="up-time">{fmtTime(t.time_start)}</div>
                    </div>
                  )) : <div style={{ fontSize: '.8rem', color: 'var(--faint)' }}>Không còn task nào hôm nay.</div>
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEAM CALENDAR */}
      {tab === 'team' && (
        <div className="rw" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 40px'}}>
          <div className="date-bar">
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '1.6rem', fontWeight: 800 }}>Team <span>Calendar</span></h1>
            <div className="date-nav">
              <button className="date-btn" onClick={() => setWeekOff(w => w - 1)}>←</button>
              <span className="date-label">{weekDates.length ? `${fmtShort(weekDates[0])} – ${fmtShort(weekDates[4])}` : 'Tuần này'}</span>
              <button className="date-btn" onClick={() => setWeekOff(w => w + 1)}>→</button>
              <button className="date-today-btn" onClick={() => setWeekOff(0)}>Tuần này</button>
            </div>
          </div>
          {loading ? <div className="t-loading">⏳ Đang tải...</div> : (
            <div className="cal-wrap" style={{ overflowX: 'auto' }}>
              <div className="cal-row-hdr" style={{ gridTemplateColumns: '150px repeat(5,1fr)', display: 'grid', gap: 1 }}>
                <div className="cal-hdr-cell">Thành viên</div>
                {weekDates.map((d, i) => {
                  const isToday = fmt(d) === fmt(new Date())
                  return <div key={i} className="cal-hdr-cell" style={{ ...(isToday ? { color: 'var(--blue)', background: 'var(--border2)' } : {}) }}>
                    {['T2','T3','T4','T5','T6'][i]}<br /><span style={{ fontSize: '.8em', opacity: .7 }}>{fmtShort(d)}</span>
                  </div>
                })}
              </div>
              {members.map(m => (
                <div key={m.username} className="cal-row" style={{ gridTemplateColumns: '150px repeat(5,1fr)', display: 'grid', gap: 1 }}>
                  <div className="cal-member">
                    <div className="cal-av">{initials(m.name)}</div>
                    <span style={{ fontSize: '.78rem' }}>{m.name.split(' ').slice(-2).join(' ')}</span>
                  </div>
                  {weekDates.map((d, i) => {
                    const dk = fmt(d)
                    const dt = allTasks.filter(t => t.assignee === m.username && t.date === dk)
                    return (
                      <div key={i} className="cal-cell">
                        {dt.slice(0, 3).map(t => (
                          <div key={t.id} className={`cal-task-mini ctm-${t.priority[0]}`} onClick={() => setPopup(t)} title={t.task_name}>
                            {t.time_start ? fmtTime(t.time_start) + ' ' : ''}{t.task_name}
                          </div>
                        ))}
                        {dt.length > 3 && <div style={{ fontSize: '.62rem', color: 'var(--faint)', padding: '.1rem .35rem' }}>+{dt.length - 3}</div>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE */}
      {tab === 'create' && (
        <div className="rw" style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 40px'}}>
          <div className="rc">
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>Tạo task mới</h2>
            <p style={{ fontSize: '.88rem', color: 'var(--muted)', marginBottom: 20 }}>Assign task cho bản thân hoặc thành viên khác trong team.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="rl">Tên task *</label>
                <input className="ri" value={form.task_name} onChange={e => setForm(f => ({ ...f, task_name: e.target.value }))} placeholder="VD: Review creative TikTok Shop..." />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="rl">Mô tả chi tiết</label>
                <textarea className="ri" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ghi chú thêm nếu cần..." rows={2} />
              </div>
              <div>
                <label className="rl">Assign cho *</label>
                <select className="ri" value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
                  {members.map(m => <option key={m.username} value={m.username}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="rl">Ngày *</label>
                <input className="ri" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="rl">Giờ bắt đầu</label>
                <input className="ri" type="time" value={form.time_start} onChange={e => setForm(f => ({ ...f, time_start: e.target.value }))} />
              </div>
              <div>
                <label className="rl">Giờ kết thúc</label>
                <input className="ri" type="time" value={form.time_end} onChange={e => setForm(f => ({ ...f, time_end: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="rl">Mức độ ưu tiên</label>
                <select className="ri" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="high">🔴 Cao — Cần làm ngay</option>
                  <option value="medium">🟡 Trung bình — Trong ngày</option>
                  <option value="low">🟢 Thấp — Khi rảnh</option>
                </select>
              </div>
            </div>
            <div className="btn-row" style={{ marginTop: 20 }}>
              <button className="btn-s" onClick={() => setTab('myday')}>Huỷ</button>
              <button className="btn-p" onClick={createTask} disabled={creating}>
                {creating ? <><span className="spinner" />Đang tạo...</> : 'Tạo task →'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </InternalLayout>
  )
}

function TaskCard({ t, onToggle, onDetail }: { t: Task; onToggle: (id: string, done: boolean) => void; onDetail: (t: Task) => void }) {
  return (
    <div className={`task-card ${CARD_CLS[t.priority]} ${t.status === 'done' ? 'done' : ''}`} onClick={() => onDetail(t)}>
      <div className="tc-top">
        <div className={`tc-check ${t.status === 'done' ? 'checked' : ''}`} onClick={e => { e.stopPropagation(); onToggle(t.id, t.status === 'done') }} />
        <div className="tc-name">{t.task_name}</div>
      </div>
      <div className="tc-meta">
        {t.time_start && <span className="tc-time">⏰ {fmtTime(t.time_start)}{t.time_end ? ' – ' + fmtTime(t.time_end) : ''}</span>}
        <span className="tc-by">{(t.created_name || '').split(' ').pop() || '—'}</span>
        <span className={`tc-pri ${PRI_CLS[t.priority]}`}>{PRI_LABEL[t.priority]}</span>
      </div>
    </div>
  )
}

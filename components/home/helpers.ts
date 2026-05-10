interface TeamMember {
  _id: string
  name: string
  role: string
  isLead?: boolean
  avatar?: { asset: { url: string } }
}

const PLACEHOLDER_TEAM: TeamMember[] = [
  { _id: '1',  name: 'Nguyễn Đức Quảng',       role: 'Team Leader',                isLead: true },
  { _id: '2',  name: 'Nguyễn Trần Khánh Linh', role: 'Digital Marketing Executive' },
  { _id: '3',  name: 'Chu Khánh Duy',           role: 'Digital Marketing Executive' },
  { _id: '4',  name: 'Thiều Anh Đức',           role: 'Digital Marketing Executive' },
  { _id: '5',  name: 'Đoàn Khánh Linh',         role: 'Digital Marketing Executive' },
  { _id: '6',  name: 'Đỗ Phương Thảo',          role: 'Digital Marketing Executive' },
  { _id: '7',  name: 'Đỗ Thị Hằng',             role: 'Digital Marketing Executive' },
  { _id: '8',  name: 'Đặng Hữu Trung',          role: 'Digital Marketing Executive' },
  { _id: '9',  name: 'Phạm Quyền Anh',          role: 'Digital Marketing Executive' },
  { _id: '10', name: 'Nguyễn Minh Khánh',       role: 'Digital Marketing Executive' },
  { _id: '11', name: 'Hoàng Bảo Ngọc',          role: 'Digital Marketing Executive' },
  { _id: '12', name: 'Nguyễn Mai Phương',       role: 'Digital Marketing Executive' },
]

export const TICKER_DEFAULT = [
  { val: '323B',  lbl: 'GMV ADS 2025',      sub: 'Tổng GMV có Ads đóng góp' },
  { val: '356B',  lbl: 'NMV TOTAL 2025',    sub: '57% NMV toàn UpBase' },
  { val: '>7x',   lbl: 'ROAS TRUNG BÌNH',   sub: 'TikTok ~6 | Shopee ~9' },
  { val: '62B',   lbl: 'BUDGET MANAGED',    sub: 'TikTok · Shopee · Meta · GG' },
  { val: '12',    lbl: 'GROWTH OPERATORS',  sub: 'Media Omni team' },
  { val: '100+',  lbl: 'BRANDS & SHOPS',    sub: 'Đang vận hành' },
]

export function buildTeamCarousel(team: TeamMember[]) {
  const row = document.getElementById('team-row')
  if (!row) return

  const members = team.length > 0 ? team : PLACEHOLDER_TEAM
  row.innerHTML = members.map(m => {
    const inner = `
      <div class="tc-avatar">
        ${m.avatar?.asset?.url ? `<img src="${m.avatar.asset.url}" alt="${m.name}" />` : `<div class="tc-initials">${m.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}</div>`}
      </div>
      <div class="tc-name">${m.name}</div>
      <div class="tc-role">${m.role}</div>
      ${m.isLead ? '<div class="tc-lead-badge">Lead</div>' : ''}
    `
    if (m.isLead) {
      return `<a class="team-card team-card--lead team-card--link" href="https://nguyenducquang.website" target="_blank" rel="noopener noreferrer" title="Xem website cá nhân của ${m.name}">${inner}</a>`
    }
    return `<div class="team-card">${inner}</div>`
  }).join('')
}

export async function doLogin() {
  const userEl = document.getElementById('login-user') as HTMLInputElement
  const passEl = document.getElementById('login-pass') as HTMLInputElement
  const btn = document.querySelector('.modal-btn') as HTMLButtonElement
  const err = document.getElementById('login-error')
  const u = userEl?.value.trim().toLowerCase()
  const p = passEl?.value
  if (!u || !p) return
  if (btn) { btn.disabled = true; btn.textContent = 'Đang đăng nhập...' }
  try {
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) })
    const j = await res.json()
    if (res.ok && j.user) {
      localStorage.setItem('mo_user', JSON.stringify(j.user))
      sessionStorage.setItem('mo_user', JSON.stringify(j.user))
      document.getElementById('login-modal')?.classList.remove('open')
      window.location.href = '/dashboard'
    } else {
      if (err) { err.style.display = 'block'; err.textContent = j.error || 'Sai username hoặc password.' }
      setTimeout(() => { if (err) err.style.display = 'none' }, 3000)
      passEl.value = ''
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Đăng nhập →' }
  }
}

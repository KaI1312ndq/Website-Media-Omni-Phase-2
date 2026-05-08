const SVG = {
  quiz:    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  tasks:   `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>`,
  score:   `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  blog:    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  users:   `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  report:  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  sop:     `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
  analytics:`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  home:    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
};

const DASH_CFG = {
  admin: { badge:'Admin / Lead', badgeClass:'rb-admin', sub:'Bạn có quyền truy cập toàn bộ hệ thống.',
    cards:[
      { icon:SVG.quiz,      title:'Quiz Hub',           desc:'Làm bài kiểm tra Dạng 1 & Dạng 2.',         badge:'dcb-available', label:'Sẵn sàng', url:'/quiz' },
      { icon:SVG.tasks,     title:'Daily Tasks',         desc:'Xem và quản lý task hàng ngày.',             badge:'dcb-available', label:'Mở',       url:'/hub/tasks' },
      { icon:SVG.score,     title:'Bảng điểm Team',     desc:'Xem điểm quiz của tất cả thành viên.',       badge:'dcb-available', label:'Xem ngay', fn:'showScores' },
      { icon:SVG.blog,      title:'Blog CMS',            desc:'Quản lý bài viết blog nội bộ.',              badge:'dcb-available', label:'CMS',      url:'/admin' },
      { icon:SVG.users,     title:'Quản lý thành viên', desc:'Tạo, sửa, phân quyền tài khoản.',           badge:'dcb-available', label:'Mở',       url:'/users' },
      { icon:SVG.report,    title:'Weekly Report',       desc:'Nhập data → AI nhận xét → Copy mail Lark.', badge:'dcb-available', label:'Mở',       url:'/hub/report' },
      { icon:SVG.sop,       title:'SOP & Resources',    desc:'Tài liệu, template, checklist nội bộ.',      badge:'dcb-soon',      label:'Phase 4' },
      { icon:SVG.analytics, title:'Analytics',           desc:'Thống kê performance report theo brand.',    badge:'dcb-available', label:'Mở',       url:'/hub/analytics' },
    ]
  },
  member: { badge:'Member', badgeClass:'rb-member', sub:'Làm bài quiz, xem kết quả và truy cập tài nguyên.',
    cards:[
      { icon:SVG.quiz,      title:'Quiz Hub',        desc:'Làm bài kiểm tra kiến thức.',                badge:'dcb-available', label:'Sẵn sàng', url:'/quiz' },
      { icon:SVG.tasks,     title:'Daily Tasks',     desc:'Xem task hàng ngày được assign.',            badge:'dcb-available', label:'Mở',       url:'/hub/tasks' },
      { icon:SVG.score,     title:'Kết quả của tôi',desc:'Xem lịch sử điểm các bài đã làm.',          badge:'dcb-available', label:'Xem',      fn:'showMyScores' },
      { icon:SVG.blog,      title:'Blog',            desc:'Viết bài và chia sẻ kiến thức.',             badge:'dcb-available', label:'Viết bài', url:'/admin' },
      { icon:SVG.report,    title:'Weekly Report',   desc:'Nhập data → AI nhận xét → Copy mail Lark.', badge:'dcb-available', label:'Mở',       url:'/hub/report' },
      { icon:SVG.analytics, title:'Analytics',       desc:'Thống kê performance report theo brand.',   badge:'dcb-available', label:'Mở',       url:'/hub/analytics' },
      { icon:SVG.sop,       title:'SOP & Resources', desc:'Tài liệu, template nội bộ.',                badge:'dcb-soon',      label:'Phase 4' },
    ]
  },
  upbase: { badge:'UpBase Staff', badgeClass:'rb-upbase', sub:'Thử quiz kiến thức marketing.',
    cards:[
      { icon:SVG.quiz, title:'Quiz Kiến thức',desc:'Bài kiểm tra performance marketing.',badge:'dcb-available',label:'Sẵn sàng',url:'/quiz' },
      { icon:SVG.home, title:'Trang chủ',      desc:'Tổng quan năng lực Media Omni.',    badge:'dcb-available',label:'Xem',      url:'/' },
    ]
  }
};

let CU = null;

function boot() {
  CU = Auth.get();
  if (!CU) { try { CU = JSON.parse(localStorage.getItem('mo_persist')); } catch {} }
  if (!CU) { location.href = '/'; return; }
  localStorage.setItem('mo_persist', JSON.stringify(CU));
  Auth.set(CU);

  document.getElementById('main-nav')?.classList.add('dash-nav');
  const cfg = DASH_CFG[CU.role] || DASH_CFG.member;
  const rb = document.getElementById('role-badge');
  const un = document.getElementById('user-name');
  if (rb) { rb.textContent = cfg.badge; rb.className = 'role-badge ' + cfg.badgeClass; }
  if (un) un.textContent = CU.name;
  const t = document.getElementById('welcome-title');
  const s = document.getElementById('welcome-sub');
  if (t) t.innerHTML = 'Xin chào, ' + CU.name.split(' ').pop() + ' <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle"><path d="M18 11V6a2 2 0 00-2-2v0a2 2 0 00-2 2v0"/><path d="M14 10V4a2 2 0 00-2-2v0a2 2 0 00-2 2v2"/><path d="M10 10.5V6a2 2 0 00-2-2v0a2 2 0 00-2 2v8"/><path d="M18 8a2 2 0 114 0v6a8 8 0 01-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 012.83-2.82L7 15"/></svg>';
  if (s) s.textContent = cfg.sub;

  const grid = document.getElementById('dash-cards');
  if (grid) {
    grid.innerHTML = cfg.cards.map(c => {
      let act = '';
      if (c.url) act = `onclick="location.href='${c.url}'"`;
      else if (c.fn) act = `onclick="${c.fn}()"`;
      const clickable = !!act;
      return `<div class="dash-card${clickable ? '' : ' disabled'}" ${act} style="${clickable ? 'cursor:pointer' : 'cursor:default'}">
        <div class="dc-icon">${c.icon}</div>
        <div class="dc-title">${c.title}</div>
        <div class="dc-desc">${c.desc}</div>
        <span class="dc-badge ${c.badge}">${c.label}</span>
      </div>`;
    }).join('');
  }
}

function doLogout() { Auth.clear(); localStorage.removeItem('mo_persist'); location.href = '/'; }

async function renderScores(u) {
  const sec  = document.getElementById('scores-section');
  const body = document.getElementById('scores-body');
  if (!sec || !body) return;
  sec.style.display = 'block'; sec.scrollIntoView({ behavior:'smooth' });
  body.innerHTML = '<div class="no-data">⏳ Đang tải...</div>';
  try {
    const j = await fetch(GS_QUIZ_URL + '?type=quiz').then(r => r.json());
    let rows = (j.data || []).reverse();
    if (u) rows = rows.filter(r => r['Username'] === u);
    if (!rows.length) { body.innerHTML = '<div class="no-data">Chưa có kết quả nào.</div>'; return; }
    body.innerHTML = rows.map(r => {
      const pct = parseInt(r['%']) || 0;
      const cls = pct >= 80 ? 'sp-high' : pct >= 50 ? 'sp-mid' : 'sp-low';
      return `<div class="st-row"><span class="st-name">${r['Họ tên']||'—'}</span><span>${r['Loại quiz']||'—'}</span><span>${r['Điểm']||0}/${r['Tổng câu']||0}</span><span><span class="score-pill ${cls}">${pct}%</span></span><span style="color:var(--faint);font-size:.8rem">${r['Ngày làm']||'—'}</span></div>`;
    }).join('');
  } catch { body.innerHTML = '<div class="no-data">❌ Lỗi tải.</div>'; }
}

function showScores()   { renderScores(null); }
function showMyScores() { renderScores(CU?.username); }
function clearScores()  { alert('Xóa trực tiếp trên Google Sheets.'); }

document.addEventListener('DOMContentLoaded', boot);

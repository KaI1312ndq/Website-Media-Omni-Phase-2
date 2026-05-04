const DASH_CFG = {
  admin: { badge:'Admin / Lead', badgeClass:'rb-admin', sub:'Bạn có quyền truy cập toàn bộ hệ thống.',
    cards:[
      { icon:'📝', title:'Quiz Hub',           desc:'Làm bài kiểm tra Dạng 1 & Dạng 2.',         badge:'dcb-available', label:'Sẵn sàng', url:'/quiz' },
      { icon:'📅', title:'Daily Tasks',         desc:'Xem và quản lý task hàng ngày.',             badge:'dcb-available', label:'Mở',       url:'/hub/tasks' },
      { icon:'📊', title:'Bảng điểm Team',     desc:'Xem điểm quiz của tất cả thành viên.',       badge:'dcb-available', label:'Xem ngay', fn:'showScores' },
      { icon:'✏️', title:'Blog CMS',            desc:'Quản lý bài viết blog nội bộ.',              badge:'dcb-available', label:'CMS',      url:'/admin' },
      { icon:'👥', title:'Quản lý thành viên', desc:'Tạo, sửa, phân quyền tài khoản.',           badge:'dcb-available', label:'Mở',       url:'/users' },
      { icon:'📬', title:'Weekly Report',       desc:'Nhập data → AI nhận xét → Copy mail Lark.', badge:'dcb-available', label:'Mở',       url:'/hub/report' },
      { icon:'📚', title:'SOP & Resources',    desc:'Tài liệu, template, checklist nội bộ.',      badge:'dcb-soon',      label:'Phase 4' },
      { icon:'📈', title:'Analytics',           desc:'Thống kê performance quiz toàn team.',       badge:'dcb-soon',      label:'Phase 3' },
    ]
  },
  member: { badge:'Member', badgeClass:'rb-member', sub:'Làm bài quiz, xem kết quả và truy cập tài nguyên.',
    cards:[
      { icon:'📝', title:'Quiz Hub',        desc:'Làm bài kiểm tra kiến thức.',             badge:'dcb-available', label:'Sẵn sàng', url:'/quiz' },
      { icon:'📅', title:'Daily Tasks',     desc:'Xem task hàng ngày được assign.',         badge:'dcb-available', label:'Mở',       url:'/hub/tasks' },
      { icon:'📊', title:'Kết quả của tôi',desc:'Xem lịch sử điểm các bài đã làm.',       badge:'dcb-available', label:'Xem',      fn:'showMyScores' },
      { icon:'✏️', title:'Blog',            desc:'Viết bài và chia sẻ kiến thức.',          badge:'dcb-available', label:'Viết bài', url:'/admin' },
      { icon:'📬', title:'Weekly Report',   desc:'Nhập data → AI nhận xét → Copy mail Lark.', badge:'dcb-available', label:'Mở',   url:'/hub/report' },
      { icon:'📚', title:'SOP & Resources',desc:'Tài liệu, template nội bộ.',              badge:'dcb-soon',      label:'Phase 4' },
    ]
  },
  upbase: { badge:'UpBase Staff', badgeClass:'rb-upbase', sub:'Thử quiz kiến thức marketing.',
    cards:[
      { icon:'📝', title:'Quiz Kiến thức',desc:'Bài kiểm tra performance marketing.',badge:'dcb-available',label:'Sẵn sàng',url:'/quiz' },
      { icon:'🏠', title:'Trang chủ',      desc:'Tổng quan năng lực Media Omni.',    badge:'dcb-available',label:'Xem',      url:'/' },
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
  if (t) t.textContent = 'Xin chào, ' + CU.name.split(' ').pop() + ' 👋';
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

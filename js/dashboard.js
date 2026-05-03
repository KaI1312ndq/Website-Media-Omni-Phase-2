/* ═══════════════════════════════════════
   MEDIA OMNI — DASHBOARD JS
═══════════════════════════════════════ */

const DASH_CFG = {
  admin: {
    badge:'Admin / Lead', badgeClass:'rb-admin',
    sub:'Bạn có quyền truy cập toàn bộ hệ thống.',
    cards:[
      { icon:'📝', title:'Quiz Hub',         desc:'Làm bài kiểm tra Dạng 1 & Dạng 2.',              badge:'dcb-available', label:'Sẵn sàng', action:'() => location.href="/quiz.html"' },
      { icon:'📅', title:'Daily Tasks',       desc:'Xem và quản lý task hàng ngày của team.',        badge:'dcb-available', label:'Mở',       action:'() => location.href="/hub/tasks.html"' },
      { icon:'📊', title:'Bảng điểm Team',    desc:'Xem điểm quiz của tất cả thành viên.',          badge:'dcb-available', label:'Xem ngay', action:'showScores' },
      { icon:'✏️', title:'Blog CMS',           desc:'Quản lý bài viết blog nội bộ.',                  badge:'dcb-available', label:'CMS',      action:'() => location.href="/admin.html"' },
      { icon:'👥', title:'Quản lý thành viên', desc:'Phân quyền tài khoản.',                         badge:'dcb-soon',      label:'Phase 3' },
      { icon:'📚', title:'SOP & Resources',   desc:'Tài liệu, template, checklist nội bộ.',          badge:'dcb-soon',      label:'Phase 4' },
      { icon:'📈', title:'Analytics',          desc:'Thống kê performance quiz toàn team.',           badge:'dcb-soon',      label:'Phase 3' },
    ]
  },
  member: {
    badge:'Member', badgeClass:'rb-member',
    sub:'Làm bài quiz, xem kết quả và truy cập tài nguyên nội bộ.',
    cards:[
      { icon:'📝', title:'Quiz Hub',       desc:'Làm bài kiểm tra kiến thức.',                badge:'dcb-available', label:'Sẵn sàng', action:'() => location.href="/quiz.html"' },
      { icon:'📅', title:'Daily Tasks',     desc:'Xem task hàng ngày được assign.',            badge:'dcb-available', label:'Mở',       action:'() => location.href="/hub/tasks.html"' },
      { icon:'📊', title:'Kết quả của tôi', desc:'Xem lịch sử điểm các bài đã làm.',          badge:'dcb-available', label:'Xem',      action:'showMyScores' },
      { icon:'📚', title:'SOP & Resources', desc:'Tài liệu, template nội bộ.',                badge:'dcb-soon',      label:'Phase 4' },
    ]
  },
  upbase: {
    badge:'UpBase Staff', badgeClass:'rb-upbase',
    sub:'Thử quiz kiến thức marketing.',
    cards:[
      { icon:'📝', title:'Quiz Kiến thức', desc:'Bài kiểm tra performance marketing.', badge:'dcb-available', label:'Sẵn sàng', action:'() => location.href="/quiz.html"' },
      { icon:'🏠', title:'Trang chủ',       desc:'Tổng quan năng lực Media Omni.',      badge:'dcb-available', label:'Xem',      action:'() => location.href="/"' },
    ]
  }
};

let CU = null;

function boot() {
  CU = Auth.get();
  if (!CU) { location.href = '/'; return; }

  // nav
  document.getElementById('main-nav')?.classList.add('dash-nav');

  // populate nav user info
  const roleBadge = document.getElementById('role-badge');
  const userName  = document.getElementById('user-name');
  const cfg = DASH_CFG[CU.role] || DASH_CFG.member;

  if (roleBadge) { roleBadge.textContent = cfg.badge; roleBadge.className = `role-badge ${cfg.badgeClass}`; }
  if (userName)  userName.textContent = CU.name;

  // welcome
  const firstName = CU.name.split(' ').pop();
  const title = document.getElementById('welcome-title');
  const sub   = document.getElementById('welcome-sub');
  if (title) title.textContent = `Xin chào, ${firstName} 👋`;
  if (sub)   sub.textContent   = cfg.sub;

  // cards
  const grid = document.getElementById('dash-cards');
  if (grid) {
    grid.innerHTML = cfg.cards.map(c => `
      <div class="dash-card${c.action ? '' : ' disabled'}" ${c.action ? `onclick="${c.action === 'showScores' ? 'showScores()' : c.action === 'showMyScores' ? 'showMyScores()' : c.action}()"` : ''}>
        <div class="dc-icon">${c.icon}</div>
        <div class="dc-title">${c.title}</div>
        <div class="dc-desc">${c.desc}</div>
        <span class="dc-badge ${c.badge}">${c.label}</span>
      </div>`).join('');
  }
}

function doLogout() {
  Auth.clear();
  location.href = '/';
}

async function renderScores(filterUser = null) {
  const sec  = document.getElementById('scores-section');
  const body = document.getElementById('scores-body');
  if (!sec || !body) return;
  sec.style.display = 'block';
  sec.scrollIntoView({ behavior:'smooth' });
  body.innerHTML = '<div class="no-data">⏳ Đang tải từ Google Sheets...</div>';
  try {
    const res  = await fetch(GS_QUIZ_URL + '?type=quiz');
    const json = await res.json();
    let rows = (json.data || []).reverse();
    if (filterUser) rows = rows.filter(r => r['Username'] === filterUser);
    if (!rows.length) { body.innerHTML = '<div class="no-data">Chưa có kết quả nào.</div>'; return; }
    body.innerHTML = rows.map(r => {
      const pct = parseInt(r['%']) || 0;
      const cls = pct >= 80 ? 'sp-high' : pct >= 50 ? 'sp-mid' : 'sp-low';
      return `<div class="st-row">
        <span class="st-name">${r['Họ tên'] || r['Username'] || '—'}</span>
        <span>${r['Loại quiz'] || '—'}</span>
        <span>${r['Điểm'] || 0}/${r['Tổng câu'] || 0}</span>
        <span><span class="score-pill ${cls}">${pct}%</span></span>
        <span style="color:var(--faint);font-size:.8rem">${fmtDate(r['Ngày làm'])}</span>
      </div>`;
    }).join('');
  } catch {
    body.innerHTML = '<div class="no-data">❌ Lỗi tải dữ liệu.</div>';
  }
}

function showScores()   { renderScores(null); }
function showMyScores() { renderScores(CU?.username); }
function clearScores()  { alert('Xóa dữ liệu thực hiện trực tiếp trên Google Sheets.'); }

const fmtDate = v => { try { const d=new Date(v); return isNaN(d)?v:d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}); } catch { return v; } };

document.addEventListener('DOMContentLoaded', boot);

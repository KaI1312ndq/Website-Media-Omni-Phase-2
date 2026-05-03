/* ═══════════════════════════════════════
   MEDIA OMNI — HOME JS
   Ticker · Team scroll · Quiz grid · Blog
═══════════════════════════════════════ */

/* ── DATA ── */
const TICKER_DATA = [
  { val:'323B',  lbl:'GMV ADS 2025',     sub:'Tổng GMV có Ads đóng góp' },
  { val:'356B',  lbl:'NMV TOTAL 2025',   sub:'57% NMV toàn UpBase' },
  { val:'>7x',   lbl:'ROAS TRUNG BÌNH',  sub:'TikTok ~6 | Shopee ~9' },
  { val:'62B',   lbl:'BUDGET MANAGED',   sub:'TikTok · Shopee · Meta · GG' },
  { val:'12',    lbl:'GROWTH OPERATORS', sub:'Media Omni team' },
  { val:'40+',   lbl:'BRANDS & SHOPS',   sub:'Đang vận hành' },
];

const QUIZ_CARDS = [
  { name:'TikTok Ads', count:'36 câu · Benchmark', active:true,
    icon:`<svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.77 0 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.13 6.33 6.34 6.34 0 0 0 12.67 0V8.69a8.28 8.28 0 0 0 4.83 1.54V6.77a4.85 4.85 0 0 1-1.07-.08z" fill="#010101"/></svg>` },
  { name:'Shopee Ads', count:'Sắp ra mắt',
    icon:`<svg viewBox="0 0 24 24"><path d="M12 2C9.5 2 7.5 3.9 7.5 6.3H6L4.5 20h15L18 6.3h-1.5C16.5 3.9 14.5 2 12 2zm0 1.8c1.8 0 3.2 1.3 3.4 3H8.6C8.8 5.1 10.2 3.8 12 3.8zm0 6.5c-2.3 0-4.2-1.5-4.8-3.5h1.5c.5 1.2 1.7 2 3.3 2s2.8-.8 3.3-2h1.5c-.6 2-2.5 3.5-4.8 3.5z" fill="#EE4D2D"/></svg>` },
  { name:'Meta Ads', count:'Sắp ra mắt',
    icon:`<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#0866FF"/></svg>` },
  { name:'Google Ads', count:'Sắp ra mắt',
    icon:`<svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>` },
  { name:'Leadership', count:'Sắp ra mắt', emoji:'👑' },
  { name:'Soft Skills', count:'Sắp ra mắt', emoji:'🤝' },
  { name:'SOP & Process', count:'Sắp ra mắt', emoji:'📋' },
  { name:'Onboarding', count:'Sắp ra mắt', emoji:'🚀' },
];

const BLOG_POSTS = [
  { slug:'dual-engine-tiktok-shopee', tag:'Strategy', date:'Tháng 4, 2026', featured:true,
    bg:'linear-gradient(135deg,#050F2C,#0A2A6E)', emoji:'🎯',
    title:'Dual Engine: TikTok Shop vs Shopee — Tại sao cần chạy cùng lúc và cách phân bổ ngân sách',
    excerpt:'TikTok Shop = demand creation, Shopee = intent capture. Hai nền tảng không cạnh tranh mà bổ sung nhau trong hành trình mua hàng.' },
  { slug:'platform-fee-roas-reset', tag:'Performance', date:'Tháng 3, 2026',
    bg:'linear-gradient(135deg,#0A1A3E,#1D4ED8)', emoji:'📊',
    title:'Platform fee TikTok tăng 14.5%: Cần reset ROAS target như thế nào?',
    excerpt:'Fee tăng mạnh đồng nghĩa benchmark ROAS cũ không còn phù hợp. Cách tính lại và đàm phán với client.' },
  { slug:'attribution-model-2026', tag:'Data', date:'Tháng 2, 2026',
    bg:'linear-gradient(135deg,#0C447C,#06B6D4)', emoji:'🔗',
    title:'Multi-touch attribution cho Ecommerce SEA — framework không cần code',
    excerpt:'Tại sao last-click attribution đang làm hại campaign và cách fix chỉ với Google Sheets.' },
];

/* ── TICKER ── */
function initTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;
  [...TICKER_DATA, ...TICKER_DATA].forEach(d => {
    const el = document.createElement('div');
    el.className = 'ticker-item';
    el.innerHTML = `
      <div class="ticker-val"><span class="blue-grad">${d.val}</span></div>
      <div><span class="ticker-lbl">${d.lbl}</span><span class="ticker-sub">${d.sub}</span></div>
      <div class="ticker-dot"></div>`;
    track.appendChild(el);
  });
}

/* ── QUIZ GRID ── */
function initQuizGrid() {
  const grid = document.getElementById('quiz-grid');
  if (!grid) return;
  grid.innerHTML = QUIZ_CARDS.map((q, i) => `
    <div class="qp-card rv d${i+1}" onclick="openLogin()">
      <div class="qp-ico">${q.emoji ? q.emoji : q.icon}</div>
      <div class="qp-name">${q.name}</div>
      <div class="qp-count">${q.count}</div>
      <span class="qp-badge ${q.active ? 'qpb-active' : 'qpb-soon'}">${q.active ? '● Active' : 'Sắp có'}</span>
      <div class="qp-lock"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
    </div>`).join('');

  // re-observe new elements
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); } });
  }, { threshold:.07, rootMargin:'0px 0px -40px 0px' });
  grid.querySelectorAll('.rv').forEach(el => obs.observe(el));
}

/* ── BLOG PREVIEW ── */
function initBlogPreview() {
  const grid = document.getElementById('blog-preview-grid');
  if (!grid) return;
  grid.innerHTML = BLOG_POSTS.map((p, i) => {
    if (p.featured) return `
      <a href="/blog.html#${p.slug}" class="blog-featured rv">
        <div class="blog-feat-img" style="background:${p.bg}">
          <div style="text-align:center">
            <div style="font-size:3rem;margin-bottom:8px">${p.emoji}</div>
            <div style="font-family:var(--f-display);font-size:1rem;font-weight:700;color:#fff;line-height:1.4">${p.title}</div>
          </div>
        </div>
        <div class="blog-feat-body">
          <div class="blog-meta"><span class="tag">${p.tag}</span><span class="blog-date">${p.date}</span></div>
          <h3 class="blog-feat-title">${p.title}</h3>
          <p class="blog-excerpt">${p.excerpt}</p>
          <span class="read-more">Đọc tiếp <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
        </div>
      </a>`;
    return `
      <a href="/blog.html#${p.slug}" class="blog-card-sm rv d${i}">
        <div class="blog-sm-img" style="background:${p.bg}">
          <div style="text-align:center">
            <div style="font-size:2rem;margin-bottom:6px">${p.emoji}</div>
            <div style="font-family:var(--f-display);font-size:.82rem;font-weight:700;color:rgba(255,255,255,.85);line-height:1.4">${p.title}</div>
          </div>
        </div>
        <div class="blog-sm-body">
          <div class="blog-meta"><span class="tag">${p.tag}</span></div>
          <h4 class="blog-sm-title">${p.title}</h4>
          <p class="blog-sm-excerpt">${p.excerpt}</p>
          <div class="blog-sm-footer">
            <span class="blog-date">${p.date}</span>
            <div class="blog-arrow"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M7 7h10v10"/></svg></div>
          </div>
        </div>
      </a>`;
  }).join('');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); } });
  }, { threshold:.07, rootMargin:'0px 0px -40px 0px' });
  grid.querySelectorAll('.rv').forEach(el => obs.observe(el));
}

/* ── TEAM SCROLL ── */
function initTeamScroll() {
  const row  = document.getElementById('team-row');
  const dots = document.getElementById('team-dots');
  const wrap = document.getElementById('team-scroll-wrap');
  if (!row || !wrap) return;

  row.innerHTML = TEAM_LIST.map(m => {
    const ini = m.name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
    return `
      <div class="team-card">
        <div class="team-av ${m.lead ? 'av-lead' : 'av-member'}">${ini}</div>
        <div class="team-name">${m.name}</div>
        <div class="team-role">${m.role}</div>
        <span class="team-badge${m.lead ? ' lead' : ''}">${m.lead ? '★ Lead' : 'Member'}</span>
      </div>`;
  }).join('');

  const DOT_N = 5;
  if (dots) {
    dots.innerHTML = Array.from({ length: DOT_N }, (_, i) =>
      `<div class="tdot${i === 0 ? ' on' : ''}" data-i="${i}"></div>`).join('');
    dots.querySelectorAll('.tdot').forEach(d =>
      d.addEventListener('click', () => {
        const max = wrap.scrollWidth - wrap.clientWidth;
        wrap.scrollTo({ left: (+d.dataset.i / (DOT_N - 1)) * max, behavior: 'smooth' });
      })
    );
  }

  wrap.addEventListener('scroll', () => {
    if (!dots) return;
    const p = wrap.scrollLeft / (wrap.scrollWidth - wrap.clientWidth);
    const idx = Math.round(p * (DOT_N - 1));
    dots.querySelectorAll('.tdot').forEach((d, i) => d.classList.toggle('on', i === idx));
  }, { passive: true });

  // drag
  let dn = false, sx, sl;
  wrap.addEventListener('mousedown', e => { dn = true; sx = e.pageX - wrap.offsetLeft; sl = wrap.scrollLeft; });
  wrap.addEventListener('mouseleave', () => dn = false);
  wrap.addEventListener('mouseup', () => dn = false);
  wrap.addEventListener('mousemove', e => {
    if (!dn) return; e.preventDefault();
    wrap.scrollLeft = sl - (e.pageX - wrap.offsetLeft - sx) * 1.4;
  });
}

/* ── MOBILE NAV SCROLL HELPER ── */
window.scrollTo = function(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', () => {
  initTicker();
  initQuizGrid();
  initBlogPreview();
  initTeamScroll();
});

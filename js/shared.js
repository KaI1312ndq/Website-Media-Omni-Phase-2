/* ═══════════════════════════════════════
   MEDIA OMNI — SHARED JS
   Users · Auth · Nav · Modal · Toast · Reveal
═══════════════════════════════════════ */

/* ── CONFIG ── */
const MO_USERS = {
  quangnd:  { pass:'omni2026lead', role:'admin',  name:'Nguyễn Đức Quảng' },
  linhntkh: { pass:'omni2026',     role:'member', name:'Nguyễn Trần Khánh Linh' },
  duychk:   { pass:'omni2026',     role:'member', name:'Chu Khánh Duy' },
  ductanh:  { pass:'omni2026',     role:'member', name:'Thiều Anh Đức' },
  linhdkh:  { pass:'omni2026',     role:'member', name:'Đoàn Khánh Linh' },
  thaodph:  { pass:'omni2026',     role:'member', name:'Đỗ Phương Thảo' },
  hangdth:  { pass:'omni2026',     role:'member', name:'Đỗ Thị Hằng' },
  trungdhu: { pass:'omni2026',     role:'member', name:'Đặng Hữu Trung' },
  anhpq:    { pass:'omni2026',     role:'member', name:'Phạm Quyền Anh' },
  khanhnm:  { pass:'omni2026',     role:'member', name:'Nguyễn Minh Khánh' },
  ngochb:   { pass:'omni2026',     role:'member', name:'Hoàng Bảo Ngọc' },
  phuongnm: { pass:'omni2026',     role:'member', name:'Nguyễn Mai Phương' },
  upbase:   { pass:'upbase2026',   role:'upbase', name:'UpBase Staff' },
};

const TEAM_LIST = [
  { name:'Nguyễn Đức Quảng',       role:'Team Leader',               lead:true },
  { name:'Nguyễn Trần Khánh Linh', role:'Digital Marketing Executive' },
  { name:'Chu Khánh Duy',          role:'Digital Marketing Executive' },
  { name:'Thiều Anh Đức',          role:'Digital Marketing Executive' },
  { name:'Đoàn Khánh Linh',        role:'Digital Marketing Executive' },
  { name:'Đỗ Phương Thảo',         role:'Digital Marketing Executive' },
  { name:'Đỗ Thị Hằng',            role:'Digital Marketing Executive' },
  { name:'Đặng Hữu Trung',         role:'Digital Marketing Executive' },
  { name:'Phạm Quyền Anh',         role:'Digital Marketing Executive' },
  { name:'Nguyễn Minh Khánh',      role:'Digital Marketing Executive' },
  { name:'Hoàng Bảo Ngọc',         role:'Digital Marketing Executive' },
  { name:'Nguyễn Mai Phương',       role:'Digital Marketing Executive' },
];

const GS_SHEET_ID = '1dJfqBW-mlkYjtAQi3fbLrmx4_zSmVLEDWGiMiZt-iEw';
const GS_QUIZ_URL = 'https://script.google.com/macros/s/AKfycbzfhieuPGmlExR0-Dv6DRT2cqG1gEdJsc1VzRy6-Jdc4wjkEiPXlPh5zKNCO2O6BCwz/exec';
const GS_TASK_URL = 'https://script.google.com/macros/s/AKfycbyTnGAY8cp5aqKpEtTWvBuTG4WMGFBEtmZakvmGSg0xtp625mzcrUcnuTUFjQTCh2tc/exec';
const GS_BLOG_URL = localStorage.getItem('mo_blog_api') || '';

/* ── UTILS ── */
const $ = id => document.getElementById(id);
const initials = name => name.split(' ').slice(-2).map(w=>w[0]).join('').toUpperCase();
const todayKey = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const fmtDate  = v => { try { const d=new Date(v); return isNaN(d)?v:d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}); } catch{return v;} };
const slugify  = s => s.toLowerCase().replace(/[àáảãạăắặằẳẵâầấẩẫậ]/g,'a').replace(/[èéẻẽẹêềếểễệ]/g,'e').replace(/[ìíỉĩị]/g,'i').replace(/[òóỏõọôồốổỗộơờớởỡợ]/g,'o').replace(/[ùúủũụưừứửữự]/g,'u').replace(/[ỳýỷỹỵ]/g,'y').replace(/đ/g,'d').replace(/[^\w\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,60);

/* ── AUTH ── */
const Auth = {
  get()  { try { return JSON.parse(sessionStorage.getItem('mo_user')); } catch { return null; } },
  set(u) { sessionStorage.setItem('mo_user', JSON.stringify(u)); },
  clear(){ sessionStorage.removeItem('mo_user'); },
  guard(redirect='/dashboard.html') { if(!this.get()){location.href=redirect;return false;} return true; },
  adminGuard(redirect='/dashboard.html') { const u=this.get(); if(!u||u.role!=='admin'){location.href=redirect;return false;} return true; },
};

/* ── TOAST ── */
let _toastTimer;
function showToast(msg, type='success') {
  let el = $('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.innerHTML = '<div class="toast-dot"></div><span id="toast-msg"></span>';
    document.body.appendChild(el);
  }
  el.className = `toast show ${type}`;
  el.querySelector('#toast-msg').textContent = msg;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ── SCROLL PROGRESS ── */
function initSP() {
  const sp = $('sp');
  if (!sp) return;
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    sp.style.width = (window.scrollY / max * 100) + '%';
  }, { passive: true });
}

/* ── NAV ── */
function initNav() {
  const nav     = $('main-nav');
  const toggle  = $('nav-toggle');
  const mob     = $('nav-mob');
  const overlay = $('mob-overlay');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
    // Active link
    let cur = '';
    document.querySelectorAll('section[id]').forEach(s => {
      if (window.scrollY >= s.offsetTop - 100) cur = s.id;
    });
    document.querySelectorAll('.nav-link').forEach(a => {
      const href = a.getAttribute('href') || '';
      a.classList.toggle('active', href === '#' + cur);
    });
  }, { passive: true });

  function closeMob() {
    mob?.classList.remove('open');
    toggle?.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggle?.addEventListener('click', () => {
    const open = mob.classList.toggle('open');
    toggle.classList.toggle('open', open);
    overlay?.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  overlay?.addEventListener('click', closeMob);
  mob?.querySelectorAll('.nav-mob-link').forEach(a => a.addEventListener('click', closeMob));
}

/* ── LOGIN MODAL ── */
function initModal() {
  const overlay = $('login-modal');
  if (!overlay) return;

  window.openLogin = () => {
    overlay.classList.add('active');
    setTimeout(() => $('login-user')?.focus(), 160);
  };
  window.closeLogin = () => {
    overlay.classList.remove('active');
    const err = $('login-error');
    if (err) err.style.display = 'none';
    ['login-user','login-pass'].forEach(id => { const el=$(id); if(el) el.value=''; });
  };
  window.doLogin = () => {
    const u = $('login-user').value.trim().toLowerCase();
    const p = $('login-pass').value;
    const user = MO_USERS[u];
    const err = $('login-error');
    if (user && user.pass === p) {
      Auth.set({ username: u, ...user });
      closeLogin();
      location.href = '/dashboard.html';
    } else {
      if (err) err.style.display = 'block';
      $('login-pass').value = '';
    }
  };
  $('login-pass')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) closeLogin(); });
  $('modal-close')?.addEventListener('click', closeLogin);
}

/* ── REVEAL ── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); } });
  }, { threshold: .07, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv,.rv-l,.rv-r').forEach(el => obs.observe(el));
}

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', () => {
  initSP();
  initNav();
  initModal();
  initReveal();
});

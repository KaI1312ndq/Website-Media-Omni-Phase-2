/* ═══════════════════════════════════════
   MEDIA OMNI — BLOG JS
   List · Filter · Single post
═══════════════════════════════════════ */
const FALLBACK_POSTS=[
  {id:'1',title:'Dual Engine: TikTok Shop vs Shopee',excerpt:'TikTok Shop = demand creation, Shopee = intent capture. Hai nền tảng bổ sung nhau trong hành trình mua hàng.',tags:['Strategy'],author:'Nguyễn Đức Quảng',date:'2026-04-10',status:'published',thumb:'🎯',bg:'linear-gradient(135deg,#050F2C,#0A2A6E)',content:`## Dual Engine Strategy\n\nTrong ecosystem ecommerce SEA, đặc biệt tại Việt Nam, TikTok Shop và Shopee không nên được xem là đối thủ nhau — chúng là **hai động cơ bổ sung** trong cùng một hành trình mua hàng.\n\n## TikTok Shop = Demand Creation\n\nTikTok hoạt động theo cơ chế discovery. Người dùng không chủ động tìm mua — họ đang scroll feed và bất ngờ bị thu hút bởi một video. Đây là môi trường lý tưởng để:\n\n- Giới thiệu sản phẩm mới\n- Xây dựng brand awareness\n- Trigger impulse purchase\n\n## Shopee = Intent Capture\n\nNgược lại, Shopee là nơi người dùng đã có intent mua hàng. Họ search, so sánh, và quyết định. ROAS trên Shopee thường cao hơn TikTok vì conversion rate cao hơn nhiều.\n\n## Phân bổ ngân sách\n\nKhông có công thức cố định, nhưng một starting point:\n\n- Brand mới, cần awareness: **70% TikTok / 30% Shopee**\n- Brand đã có tên, push conversion: **40% TikTok / 60% Shopee**\n- Flash sale campaign: **20% TikTok / 80% Shopee**\n\n> Quan trọng: đo lường cross-channel attribution để hiểu TikTok đang assist bao nhiêu cho Shopee conversion.`},
  {id:'2',title:'Platform fee tăng 14.5%: Reset ROAS như thế nào?',excerpt:'Fee tăng mạnh đồng nghĩa benchmark ROAS cũ không còn phù hợp. Cách tính lại và đàm phán với client.',tags:['Performance'],author:'Nguyễn Đức Quảng',date:'2026-03-15',status:'published',thumb:'📊',bg:'linear-gradient(135deg,#0A1A3E,#1D4ED8)',content:`## Tại sao ROAS target cần reset?\n\nTừ Q1 2026, TikTok Shop tăng platform fee lên **12.5–14.5%** (từ mức 8–10% trước đó). Điều này ảnh hưởng trực tiếp đến P&L của brand.\n\n## Tính lại Break-even ROAS\n\nCông thức cơ bản:\n\n**Break-even ROAS = 1 ÷ (Gross Margin - Platform Fee - Fulfillment %)**\n\nVí dụ:\n- Gross margin: 50%\n- Platform fee: 14%\n- Fulfillment: 4%\n- Break-even ROAS = 1 ÷ (0.50 - 0.14 - 0.04) = **3.13x**\n\nNghĩa là ROAS dưới 3.13 = lỗ.\n\n## Điều chỉnh target\n\nNếu trước đây ROAS target = 5x với fee 8%, thì nay với fee 14%, target cần tăng lên ít nhất **6–7x** để giữ nguyên margin.\n\n## Đàm phán với client\n\n1. Show breakdown P&L rõ ràng\n2. Đề xuất tăng budget để maintain scale\n3. Hoặc focus vào sản phẩm margin cao hơn`},
  {id:'3',title:'Multi-touch attribution cho Ecommerce SEA',excerpt:'Tại sao last-click attribution đang làm hại campaign và cách fix chỉ với Google Sheets.',tags:['Data'],author:'Nguyễn Đức Quảng',date:'2026-02-20',status:'published',thumb:'🔗',bg:'linear-gradient(135deg,#0C447C,#06B6D4)',content:`## Vấn đề với Last-click Attribution\n\nMặc định hầu hết platform báo cáo theo **last-click**: toàn bộ credit gắn vào kênh cuối cùng trước khi mua. Điều này khiến:\n\n- TikTok bị undervalue (tạo awareness nhưng mất credit)\n- Shopee bị overvalue (chỉ capture intent đã có)\n- Quyết định budget sai lệch\n\n## Framework đơn giản không cần code\n\nDùng Google Sheets với 3 bước:\n\n### Bước 1: Thu thập data touchpoints\nGán UTM cho mỗi kênh, export click data về Sheet.\n\n### Bước 2: Áp dụng position-based model\n- 40% credit: first touch (kênh đầu tiên)\n- 40% credit: last touch (kênh cuối)\n- 20% chia đều các kênh giữa\n\n### Bước 3: So sánh với last-click\nChênh lệch cho thấy kênh nào đang bị đánh giá sai.\n\n> Tip: TikTok thường bị undervalue 30–50% khi dùng last-click.`},
];

let allPosts=[], activeTag='ALL', searchQ='';

async function loadPosts(){
  const api = GS_BLOG_URL || localStorage.getItem('mo_blog_api') || '';
  if(api){
    try{
      const r=await fetch(api+'?action=list');const j=await r.json();
      allPosts=(j.posts||[]).filter(p=>p.status==='published');
    }catch{ allPosts=FALLBACK_POSTS; }
  }else{ allPosts=FALLBACK_POSTS; }
  buildTagFilters();renderGrid(allPosts);
  // Deep link by ?id= query param (or legacy #hash)
  const params = new URLSearchParams(location.search);
  const qid = params.get('id');
  const hash = location.hash.replace('#','');
  const key = qid || hash;
  if(key){ const p=allPosts.find(x=>x.id===key||slugify(x.title)===key||(x.slug&&x.slug===key)); if(p)openPost(p); }
}

function buildTagFilters(){
  const tags=['ALL',...new Set(allPosts.flatMap(p=>p.tags||[]))];
  document.getElementById('tag-filters').innerHTML=tags.map(t=>
    `<button class="tf${t==='ALL'?' active':''}" onclick="setTag('${t}',this)">${t==='ALL'?'Tất cả':t}</button>`
  ).join('');
}

function setTag(t,btn){
  activeTag=t;
  document.querySelectorAll('.tf').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  filterPosts();
}

function filterPosts(){
  searchQ=document.getElementById('blog-search').value.toLowerCase();
  const filtered=allPosts.filter(p=>{
    const tagOk=activeTag==='ALL'||(p.tags||[]).includes(activeTag);
    const searchOk=!searchQ||p.title.toLowerCase().includes(searchQ)||p.excerpt?.toLowerCase().includes(searchQ);
    return tagOk&&searchOk;
  });
  renderGrid(filtered);
}

function renderGrid(posts){
  const grid=document.getElementById('blog-grid');
  if(!posts.length){grid.innerHTML='<div class="blog-empty">Không tìm thấy bài viết phù hợp.</div>';return;}
  grid.innerHTML=posts.map((p,i)=>{
    const isFirst=i===0;
    const thumbHtml=p.thumb?.startsWith('http')
      ?`<img src="${p.thumb}" style="width:100%;height:100%;object-fit:cover">`
      :`<span class="bc-thumb-emoji">${p.thumb||'📝'}</span>`;
    const dateStr=p.date?new Date(p.date).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
    const words=(p.content||'').split(/\s+/).length;
    const mins=Math.max(1,Math.round(words/200));
    return `
      <div class="blog-card${isFirst?' blog-featured-card':''} rv d${i+1}" onclick="openPost(${JSON.stringify(JSON.stringify(p)).slice(1,-1)})">
        <div class="bc-thumb" style="background:${p.bg||'linear-gradient(135deg,#050F2C,#1D4ED8)'}">${thumbHtml}</div>
        <div class="bc-body">
          <div class="bc-meta">
            ${(p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}
            <span class="bc-date">${dateStr}</span>
          </div>
          <div class="bc-title">${p.title}</div>
          <div class="bc-excerpt">${p.excerpt||''}</div>
          <div class="bc-footer">
            <span class="bc-read">⏱ ${mins} phút đọc</span>
            <div class="bc-arrow"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M7 7h10v10"/></svg></div>
          </div>
        </div>
      </div>`;
  }).join('');

  // Re-observe reveals
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');obs.unobserve(e.target);}});
  },{threshold:.07,rootMargin:'0px 0px -40px 0px'});
  grid.querySelectorAll('.rv').forEach(el=>obs.observe(el));
}

function openPost(p){
  if(typeof p==='string') try{ p=JSON.parse(p); }catch{ return; }
  document.getElementById('list-page').style.display='none';
  document.getElementById('post-page').style.display='block';
  document.getElementById('post-tag-row').innerHTML=(p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('');
  document.getElementById('post-title').textContent=p.title;
  document.getElementById('post-author').textContent=p.author||'Media Omni';
  document.getElementById('post-date').textContent=p.date?new Date(p.date).toLocaleDateString('vi-VN',{day:'2-digit',month:'long',year:'numeric'}):'';
  const words=(p.content||'').split(/\s+/).length;
  document.getElementById('post-read').textContent=`⏱ ${Math.max(1,Math.round(words/200))} phút đọc`;
  const thumbEl=document.getElementById('post-thumb');
  thumbEl.style.background=p.bg||'linear-gradient(135deg,#050F2C,#1D4ED8)';
  thumbEl.textContent=p.thumb?.startsWith('http')?'':p.thumb||'📝';
  document.getElementById('post-body').innerHTML=mdToHtml(p.content||'');
  window.scrollTo({top:0,behavior:'smooth'});
  const slug = p.slug || slugify(p.title);
  history.pushState(null,'','/blog?id='+slug);
  // Update page title + meta for this post (helps Google)
  document.title = p.title + ' — Media Omni';
  document.querySelector('meta[name="description"]')?.setAttribute('content', p.excerpt || p.title);
}

function backToList(){
  document.getElementById('post-page').style.display='none';
  document.getElementById('list-page').style.display='block';
  history.pushState(null,'','/blog');
  document.title = 'Blog & Insights — Media Omni | Performance Marketing';
  window.scrollTo({top:0,behavior:'smooth'});
}

function mdToHtml(md){
  return md
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/^> (.+)$/gm,'<div class="post-callout"><p>$1</p></div>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g,'<ul>$1</ul>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code style="font-family:var(--f-mono);font-size:.85em;background:var(--paper2);padding:.1em .4em;border-radius:4px">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" target="_blank" style="color:var(--blue);font-weight:600">$1</a>')
    .replace(/^---$/gm,'<hr style="border:none;border-top:1px solid var(--border);margin:24px 0">')
    .replace(/\n\n/g,'</p><p>')
    .replace(/^(?!<[hpuodl])/gm,match=>match)
    .replace(/(<\/h[23]>|<\/div>|<\/ul>|<hr[^>]*>)\s*<\/p>/g,'$1')
    .replace(/<p>(<h[23]>)/g,'$1')
    .replace(/<p>(<div)/g,'$1')
    .replace(/<p>(<ul>)/g,'$1')
    .replace(/<p>(<hr)/g,'$1')
    .replace(/<p>\s*<\/p>/g,'')
    .replace(/^(.)/,'<p>$1')
    +'</p>';
}

const slugify=s=>s.toLowerCase().replace(/[^\w\s-]/g,'').replace(/\s+/g,'-').slice(0,60);

document.addEventListener('DOMContentLoaded',loadPosts);

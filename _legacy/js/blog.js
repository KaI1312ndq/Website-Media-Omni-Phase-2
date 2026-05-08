/* ═══════════════════════════════════════
   MEDIA OMNI — BLOG JS
   List · Filter · Single post
═══════════════════════════════════════ */
const FALLBACK_POSTS=[
  {id:'fb-1',slug:'dual-engine-tiktok-shopee',
   title:'Dual Engine: TikTok Shop vs Shopee — Tại sao cần chạy cùng lúc và cách phân bổ ngân sách',
   excerpt:'TikTok Shop = demand creation, Shopee = intent capture. Hai nền tảng không cạnh tranh mà bổ sung nhau trong hành trình mua hàng.',
   tags:['Strategy'],author:'Nguyễn Đức Quảng',date:'2026-04-10',status:'published',
   thumb:'🎯',bg:'linear-gradient(135deg,#050F2C,#0A2A6E)',
   content:`## TikTok Shop vs Shopee: Không phải đối thủ, là đồng minh

Trong ecosystem ecommerce SEA, đặc biệt tại Việt Nam, nhiều brand đang chọn **một trong hai** — hoặc TikTok, hoặc Shopee. Đây là sai lầm chiến lược nghiêm trọng nhất mà Media Omni quan sát được ở 100+ brands.

Thực tế, TikTok Shop và Shopee là **hai động cơ bổ sung** trong cùng một hành trình mua hàng.

## TikTok Shop = Demand Creation

TikTok hoạt động theo cơ chế **discovery**. Người dùng không chủ động tìm mua — họ đang scroll feed và bất ngờ bị thu hút bởi một video. Đây là môi trường lý tưởng để:

- Giới thiệu sản phẩm mới chưa có demand
- Xây dựng brand awareness với chi phí thấp hơn Meta
- Trigger impulse purchase qua livestream và short video
- Tạo viral effect khi content được chia sẻ tự nhiên

> TikTok không chỉ bán hàng — nó tạo ra nhu cầu chưa tồn tại trước đó.

## Shopee = Intent Capture

Ngược lại, Shopee là nơi người dùng **đã có intent mua hàng**. Họ search, so sánh giá, đọc review, và quyết định. ROAS trên Shopee thường cao hơn TikTok vì conversion rate cao hơn nhiều.

Shopee Ads hiệu quả nhất khi:

- Capture demand đã được TikTok tạo ra
- Defend thị phần khi competitor chạy search ads
- Push conversion vào cuối tháng hoặc flash sale

## Framework phân bổ ngân sách

Không có công thức cố định, nhưng đây là starting point đã được validate qua nhiều brand:

- **Brand mới, cần awareness:** 70% TikTok / 30% Shopee
- **Brand đã có tên, push conversion:** 40% TikTok / 60% Shopee
- **Flash sale / campaign lớn:** 20% TikTok / 80% Shopee

### Cách đo cross-channel impact

Bật UTM tracking cho mọi TikTok traffic vào Shopee. Theo dõi:

- Shopee search volume tăng bao nhiêu % sau khi tăng TikTok budget?
- Brand keyword search có tăng không?
- ROAS Shopee có cải thiện khi TikTok chạy mạnh?

> Quan trọng: đo lường cross-channel attribution để hiểu TikTok đang assist bao nhiêu cho Shopee conversion. Nhiều brand tắt TikTok vì ROAS thấp và mất đi 30–40% Shopee revenue mà không biết tại sao.`},

  {id:'fb-2',slug:'platform-fee-roas-reset',
   title:'Platform fee TikTok tăng 14.5%: Cần reset ROAS target như thế nào?',
   excerpt:'Fee tăng mạnh đồng nghĩa benchmark ROAS cũ không còn phù hợp. Cách tính lại break-even ROAS và đàm phán với client.',
   tags:['Performance'],author:'Nguyễn Đức Quảng',date:'2026-03-15',status:'published',
   thumb:'📊',bg:'linear-gradient(135deg,#0A1A3E,#1D4ED8)',
   content:`## Tại sao ROAS target cần được reset ngay?

Từ Q1 2026, TikTok Shop tăng platform fee lên **12.5–14.5%** (từ mức 8–10% trước đó). Đây là mức tăng 50–80% chỉ trong một năm. Điều này ảnh hưởng trực tiếp đến P&L của brand — nhưng nhiều team vẫn đang dùng ROAS target cũ và không nhận ra mình đang lỗ.

## Công thức Break-even ROAS

Break-even ROAS là con số ROAS tối thiểu để **không lỗ**. Mọi ROAS dưới ngưỡng này là đang đốt tiền.

**Break-even ROAS = 1 ÷ (Gross Margin - Platform Fee - Fulfillment %)**

### Ví dụ thực tế:

- Gross margin sản phẩm: **50%**
- Platform fee TikTok mới: **14%**
- Fulfillment + đóng gói + vận chuyển: **4%**
- Break-even ROAS = 1 ÷ (0.50 - 0.14 - 0.04) = **3.13x**

Nghĩa là ROAS dưới 3.13x = **lỗ thực sự**, dù báo cáo nhìn có vẻ ổn.

> Lưu ý: Gross margin ở đây là sau giá vốn, chưa trừ các chi phí vận hành khác. Với brand có nhiều chi phí cố định, break-even ROAS thực tế còn cao hơn.

## Điều chỉnh ROAS target

Nếu trước đây ROAS target = 5x với fee 8%, thì nay với fee 14%, target cần tăng lên ít nhất **6–7x** để giữ nguyên margin.

### Cách tính target theo margin mong muốn:

- Muốn profit margin 15%: ROAS target = 1 ÷ (0.50 - 0.14 - 0.04 - 0.15) = **5.88x**
- Muốn profit margin 20%: ROAS target = 1 ÷ (0.50 - 0.14 - 0.04 - 0.20) = **8.33x**

## Đàm phán với client khi ROAS giảm

Khi fee tăng, ROAS sẽ tự nhiên giảm dù hiệu quả Ads không thay đổi. Đây là cách trình bày với client:

- Show breakdown P&L rõ ràng, so sánh trước/sau khi fee tăng
- Đề xuất tăng giá bán hoặc cải thiện gross margin sản phẩm
- Tập trung vào **ROI thực tế** (lợi nhuận ròng) thay vì chỉ nhìn ROAS
- Hoặc shift sang sản phẩm có margin cao hơn để compensate`},

  {id:'fb-3',slug:'attribution-model-2026',
   title:'Multi-touch attribution cho Ecommerce SEA — framework không cần code',
   excerpt:'Tại sao last-click attribution đang làm hại campaign và cách fix chỉ với Google Sheets.',
   tags:['Data'],author:'Nguyễn Đức Quảng',date:'2026-02-20',status:'published',
   thumb:'🔗',bg:'linear-gradient(135deg,#0C447C,#06B6D4)',
   content:`## Last-click attribution đang làm hại quyết định budget của bạn

Mặc định, **hầu hết platform báo cáo theo last-click**: toàn bộ credit bán hàng gắn vào kênh cuối cùng trước khi mua. Điều này nghe có vẻ hợp lý, nhưng thực tế nó bóp méo toàn bộ bức tranh.

### Hệ quả của last-click:

- TikTok bị **undervalue** — tạo awareness và demand nhưng không được credit
- Shopee bị **overvalue** — chỉ capture intent đã có từ TikTok, nhưng nhận 100% credit
- Team quyết định cắt TikTok budget → Shopee ROAS cũng giảm theo → không hiểu tại sao

> Theo nghiên cứu nội bộ của Media Omni, TikTok thường bị undervalue 30–50% khi dùng last-click attribution thuần túy.

## Framework multi-touch attribution không cần code

Dùng Google Sheets với 3 bước đơn giản:

### Bước 1: Thu thập data touchpoints

Gán UTM parameter cho mọi kênh traffic:
- `utm_source=tiktok&utm_medium=paid`
- `utm_source=shopee&utm_medium=search_ads`
- `utm_source=meta&utm_medium=paid`

Export click + conversion data về một Sheet duy nhất.

### Bước 2: Áp dụng Position-based model

Đây là model cân bằng nhất cho ecommerce SEA:

- **40% credit** → first touch (kênh đầu tiên tạo awareness)
- **40% credit** → last touch (kênh cuối convert)
- **20% credit** → chia đều cho các kênh ở giữa

### Bước 3: So sánh với last-click

Tạo cột so sánh "Last-click Revenue" vs "Position-based Revenue" cho từng kênh. Chênh lệch chính là mức độ bị đánh giá sai.

## Khi nào nên dùng model nào?

- **Last-click**: Campaign ngắn ngày, flash sale — người dùng ít touchpoint
- **Position-based**: Sản phẩm giá cao, hành trình mua dài, nhiều kênh
- **Time-decay**: Remarketing campaign, khi touchpoint gần nhất quan trọng nhất

> Mục tiêu cuối cùng: phân bổ budget dựa trên **contribution thực sự** của từng kênh, không phải ai được credit cuối cùng.`},
];

let allPosts=[], activeTag='ALL', searchQ='';
const postMap={};

async function loadPosts(){
  // Show fallback immediately — no blank loading state
  allPosts = FALLBACK_POSTS;
  buildTagFilters(); renderGrid(allPosts);

  // Fetch live posts in background; replace if successful
  const api = GS_BLOG_URL || localStorage.getItem('mo_blog_api') || '';
  if(!api) return;
  try{
    const ctrl=new AbortController();
    const tid=setTimeout(()=>ctrl.abort(),8000);
    const r=await fetch(api+'?action=list',{signal:ctrl.signal});
    clearTimeout(tid);
    const j=await r.json();
    const live=(j.posts||[]).filter(p=>p.status==='published');
    if(live.length){
      // Merge: live CMS posts first, then fallback posts not already covered
      const liveKeys=new Set(live.map(p=>p.slug||slugify(p.title)));
      allPosts=[...live,...FALLBACK_POSTS.filter(p=>!liveKeys.has(p.slug||slugify(p.title)))];
      buildTagFilters(); renderGrid(allPosts);
    }
  }catch{ /* keep fallback already rendered */ }
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
    const key=String(p.id);
    postMap[key]=p;
    const isFirst=i===0;
    const thumbHtml=p.thumb?.startsWith('http')
      ?`<img src="${p.thumb}" style="width:100%;height:100%;object-fit:cover">`
      :`<span class="bc-thumb-emoji">${p.thumb||'📝'}</span>`;
    const dateStr=p.date?new Date(p.date).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
    const words=(p.content||'').split(/\s+/).length;
    const mins=Math.max(1,Math.round(words/200));
    return `
      <div class="blog-card${isFirst?' blog-featured-card':''} rv d${i+1}" data-post-id="${key}">
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

  // Attach click via event delegation — no JSON in HTML attributes
  grid.querySelectorAll('[data-post-id]').forEach(el=>{
    el.addEventListener('click',()=>openPost(postMap[el.dataset.postId]));
  });

  // Re-observe reveals
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');obs.unobserve(e.target);}});
  },{threshold:.07,rootMargin:'0px 0px -40px 0px'});
  grid.querySelectorAll('.rv').forEach(el=>obs.observe(el));
}

function openPost(p){
  if(!p) return;
  if(typeof p==='string') p=postMap[p]||allPosts.find(x=>String(x.id)===p);
  if(!p) return;
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
  const postUrl = 'https://mediaomni.site/blog?id=' + slug;
  history.pushState(null,'','/blog?id='+slug);

  // Update page title + meta
  document.title = p.title + ' — Media Omni';
  const desc = p.excerpt || p.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', desc);

  // Update OG + Twitter tags for this post
  const setMeta = (sel, val) => document.querySelector(sel)?.setAttribute('content', val);
  setMeta('meta[property="og:title"]',       p.title + ' — Media Omni');
  setMeta('meta[property="og:description"]', desc);
  setMeta('meta[property="og:url"]',         postUrl);
  setMeta('meta[property="og:type"]',        'article');
  setMeta('meta[name="twitter:title"]',      p.title + ' — Media Omni');
  setMeta('meta[name="twitter:description"]',desc);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', postUrl);

  // Inject Article JSON-LD
  document.getElementById('post-schema')?.remove();
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.id   = 'post-schema';
  ld.textContent = JSON.stringify({
    '@context':       'https://schema.org',
    '@type':          'BlogPosting',
    'headline':       p.title,
    'description':    desc,
    'url':            postUrl,
    'datePublished':  p.date || '',
    'author': { '@type': 'Person', 'name': p.author || 'Media Omni' },
    'publisher': {
      '@type': 'Organization',
      'name':  'Media Omni',
      'url':   'https://mediaomni.site',
      'logo':  'https://mediaomni.site/favicon.svg'
    },
    'inLanguage': 'vi-VN'
  });
  document.head.appendChild(ld);
}

function backToList(){
  document.getElementById('post-page').style.display='none';
  document.getElementById('list-page').style.display='block';
  history.pushState(null,'','/blog');
  document.title = 'Blog & Insights — Media Omni | Performance Marketing';
  const setMeta = (sel,val) => document.querySelector(sel)?.setAttribute('content',val);
  const listDesc = 'Kiến thức thực chiến về performance marketing: case study, framework và playbook từ Media Omni.';
  setMeta('meta[name="description"]',        listDesc);
  setMeta('meta[property="og:title"]',       'Blog & Insights — Media Omni');
  setMeta('meta[property="og:description"]', listDesc);
  setMeta('meta[property="og:url"]',         'https://mediaomni.site/blog');
  setMeta('meta[property="og:type"]',        'website');
  setMeta('meta[name="twitter:title"]',      'Blog & Insights — Media Omni');
  setMeta('meta[name="twitter:description"]',listDesc);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href','https://mediaomni.site/blog');
  document.getElementById('post-schema')?.remove();
  window.scrollTo({top:0,behavior:'smooth'});
}

function mdToHtml(md){
  // Normalize double-escaped sequences from GAS and plain-text bullets
  md=md.replace(/\\n/g,'\n').replace(/\\"/g,'"').replace(/\\'/g,"'");
  md=md.replace(/^[•·→]\s*/gm,'- ');
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

document.addEventListener('DOMContentLoaded',loadPosts);

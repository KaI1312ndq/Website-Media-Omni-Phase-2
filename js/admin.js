const BLOG_API='https://script.google.com/macros/s/AKfycbwATcajpuheeyLbfjrY2OHJxTVROZjAK71B9ICwdegXyJmmeMz9QZoPmzzymY5kWWPk/exec';
let posts=[],editingId=null,edStatus='draft',edTags=[];
function bootAdmin(){
  const u=Auth.get()||(()=>{try{return JSON.parse(localStorage.getItem('mo_persist'));}catch{}})();
  if(!u){location.href='/';return;}
  if(u.role!=='admin'){location.href='/dashboard';return;}
  Auth.set(u);localStorage.setItem('mo_persist',JSON.stringify(u));
  loadPosts();
}
async function loadPosts(){
  const body=document.getElementById('posts-body');
  body.innerHTML='<div class="no-posts">⏳ Đang tải...</div>';
  try{
    const j=await fetch(BLOG_API+'?action=list').then(r=>r.json());
    posts=j.posts||[];
    document.getElementById('post-count').textContent=posts.length+' bài viết';
    renderPostList();
  }catch{body.innerHTML='<div class="no-posts">❌ Không kết nối được API.</div>';}
}
function renderPostList(){
  const body=document.getElementById('posts-body');
  if(!posts.length){body.innerHTML='<div class="no-posts">Chưa có bài viết. Tạo bài đầu tiên!</div>';return;}
  body.innerHTML=posts.map(p=>{
    const date=p.date?new Date(p.date).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}):'—';
    const tags=Array.isArray(p.tags)?p.tags.join(', '):(p.tags||'—');
    const sc=p.status==='published'?'pts-pub':'pts-draft';
    const sl=p.status==='published'?'🟢 Published':'📝 Draft';
    return `<div class="pt-row"><span class="pt-title">${p.title||'—'}</span><span class="pt-tag">${tags}</span><span class="pt-date">${date}</span><span><span class="pt-status ${sc}">${sl}</span></span><div class="pt-actions"><button class="pt-act" onclick="editPost('${p.id}')">Sửa</button><button class="pt-act pt-del" onclick="deletePost('${p.id}')">Xóa</button></div></div>`;
  }).join('');
}
function newPost(){
  editingId=null;edStatus='draft';edTags=[];
  ['ed-title','ed-excerpt','ed-content'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('ed-thumb').value='🎯';
  document.getElementById('ed-bg').value='linear-gradient(135deg,#050F2C,#0A2A6E)';
  document.getElementById('ed-author').value=Auth.get()?.name||'';
  document.getElementById('ed-date').value=new Date().toISOString().split('T')[0];
  document.getElementById('tags-wrap').innerHTML='<input class="tag-add-inp" id="tag-inp" placeholder="Nhập tag, Enter để thêm" onkeydown="addTag(event)">';
  setStatus('draft');updateThumb();
  document.getElementById('editor-section').style.display='block';
  document.getElementById('editor-section').scrollIntoView({behavior:'smooth'});
}
function editPost(id){
  const p=posts.find(x=>x.id==id);if(!p)return;
  editingId=id;edStatus=p.status||'draft';
  edTags=Array.isArray(p.tags)?[...p.tags]:(p.tags?p.tags.split(',').map(t=>t.trim()):[]);
  document.getElementById('ed-title').value=p.title||'';
  document.getElementById('ed-excerpt').value=p.excerpt||'';
  document.getElementById('ed-content').value=p.content||'';
  document.getElementById('ed-thumb').value=p.thumb||'📝';
  document.getElementById('ed-bg').value=p.bg||'';
  document.getElementById('ed-author').value=p.author||'';
  document.getElementById('ed-date').value=p.date||'';
  renderTags();setStatus(edStatus);updateThumb();
  document.getElementById('editor-section').style.display='block';
  document.getElementById('editor-section').scrollIntoView({behavior:'smooth'});
}
async function savePost(){
  const title=document.getElementById('ed-title').value.trim();
  if(!title){showToast('Vui lòng nhập tiêu đề','error');return;}
  const btn=document.getElementById('btn-save');
  btn.disabled=true;btn.textContent='Đang lưu...';
  const payload={action:editingId?'update':'create',id:editingId,title,
    excerpt:document.getElementById('ed-excerpt').value.trim(),
    content:document.getElementById('ed-content').value,
    tags:edTags,author:document.getElementById('ed-author').value.trim(),
    date:document.getElementById('ed-date').value,status:edStatus,
    thumb:document.getElementById('ed-thumb').value.trim()||'📝',
    bg:document.getElementById('ed-bg').value.trim()||'linear-gradient(135deg,#050F2C,#0A2A6E)'};
  try{
    await fetch(BLOG_API,{method:'POST',body:JSON.stringify(payload)});
    showToast(editingId?'✅ Đã cập nhật!':'✅ Đã tạo bài mới!');
    cancelEdit();loadPosts();
  }catch{showToast('❌ Lỗi lưu bài','error');}
  finally{btn.disabled=false;btn.textContent='Lưu bài →';}
}
async function deletePost(id){
  if(!confirm('Xóa bài viết này?'))return;
  try{await fetch(BLOG_API,{method:'POST',body:JSON.stringify({action:'delete',id})});showToast('Đã xóa');loadPosts();}
  catch{showToast('Lỗi xóa','error');}
}
function cancelEdit(){document.getElementById('editor-section').style.display='none';editingId=null;}
function ins(b,a){const ta=document.getElementById('ed-content');const s=ta.selectionStart,e=ta.selectionEnd;const sel=ta.value.substring(s,e);ta.value=ta.value.substring(0,s)+b+sel+a+ta.value.substring(e);ta.focus();}
function addTag(e){if(e.key!=='Enter'&&e.key!==',')return;e.preventDefault();const v=e.target.value.trim().replace(/,/g,'');if(v&&!edTags.includes(v)){edTags.push(v);renderTags();}e.target.value='';}
function removeTag(t){edTags=edTags.filter(x=>x!==t);renderTags();}
function renderTags(){const wrap=document.getElementById('tags-wrap');wrap.innerHTML=edTags.map(t=>`<span class="tag-pill">${t}<button onclick="removeTag('${t}')">×</button></span>`).join('')+'<input class="tag-add-inp" id="tag-inp" placeholder="Nhập tag, Enter để thêm" onkeydown="addTag(event)">';}
function setStatus(s){edStatus=s;document.getElementById('s-draft').className='s-btn'+(s==='draft'?' active-draft':'');document.getElementById('s-pub').className='s-btn'+(s==='published'?' active-pub':'');}
function updateThumb(){const val=document.getElementById('ed-thumb').value.trim();const bg=document.getElementById('ed-bg').value.trim()||'linear-gradient(135deg,#050F2C,#0A2A6E)';const prev=document.getElementById('thumb-preview');prev.style.background=bg;prev.textContent=val.startsWith('http')?'':val||'📝';}
document.addEventListener('DOMContentLoaded',bootAdmin);

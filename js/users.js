const USERS_API='https://script.google.com/macros/s/AKfycbyWzVCwfiq4DzWn77Edw5t2suKwm4Vlpvmz5lnSndBXi60-pqy7cgVBLQ9ZflABEujP/exec';
let allUsers=[],editingUser=null,filterRole='ALL',searchQ='';
function bootUsers(){
  const u=Auth.get()||(()=>{try{return JSON.parse(localStorage.getItem('mo_persist'));}catch{}})();
  if(!u){location.href='/';return;}
  if(u.role!=='admin'){location.href='/dashboard';return;}
  Auth.set(u);localStorage.setItem('mo_persist',JSON.stringify(u));
  loadUsers();
}
async function loadUsers(){
  document.getElementById('user-tbody').innerHTML='<div class="no-users">⏳ Đang tải...</div>';
  try{
    const j=await fetch(USERS_API+'?type=users').then(r=>r.json());
    allUsers=j.users||[];renderStats();renderUserList();
  }catch{document.getElementById('user-tbody').innerHTML='<div class="no-users">❌ Không tải được.</div>';}
}
function renderStats(){
  document.getElementById('s-total').textContent=allUsers.length;
  document.getElementById('s-admin').textContent=allUsers.filter(u=>u.role==='admin').length;
  document.getElementById('s-member').textContent=allUsers.filter(u=>u.role==='member').length;
  document.getElementById('s-active').textContent=allUsers.filter(u=>u.status!=='disabled').length;
}
function renderUserList(){
  const filtered=allUsers.filter(u=>{
    const roleOk=filterRole==='ALL'||u.role===filterRole;
    const searchOk=!searchQ||u.name?.toLowerCase().includes(searchQ)||u.username?.toLowerCase().includes(searchQ);
    return roleOk&&searchOk;
  });
  const body=document.getElementById('user-tbody');
  if(!filtered.length){body.innerHTML='<div class="no-users">Không tìm thấy tài khoản.</div>';return;}
  body.innerHTML=filtered.map(u=>{
    const rCls=u.role==='admin'?'rp-admin':u.role==='upbase'?'rp-upbase':'rp-member';
    const sCls=u.status==='disabled'?'sp-disabled':'sp-active';
    const created=u.created_at?new Date(u.created_at).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}):'—';
    const isMe=u.username===Auth.get()?.username;
    return `<div class="ut-row"><div><div class="ut-name">${u.name||'—'}</div></div><div class="ut-user">${u.username}</div><span><span class="role-pill ${rCls}">${u.role}</span></span><span><span class="status-pill ${sCls}">${u.status==='disabled'?'Disabled':'Active'}</span></span><span style="font-size:.78rem;color:var(--faint)">${created}</span><div class="ut-actions"><button class="ua-btn" onclick="openEdit('${u.username}')">Sửa</button><button class="ua-btn" onclick="toggleStatus('${u.username}','${u.status}')">${u.status==='disabled'?'Bật':'Tắt'}</button>${!isMe?`<button class="ua-btn ua-del" onclick="deleteUser('${u.username}')">Xóa</button>`:''}</div></div>`;
  }).join('');
}
function setFilter(role,btn){filterRole=role;document.querySelectorAll('.sb-filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderUserList();}
function doSearch(){searchQ=document.getElementById('user-search').value.toLowerCase();renderUserList();}
function switchTab(tab){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  document.getElementById('tab-list').style.display=tab==='list'?'block':'none';
  document.getElementById('tab-create').style.display=tab==='create'?'block':'none';
  if(tab==='list'){editingUser=null;resetForm();}
}
function openCreate(){
  editingUser=null;resetForm();switchTab('create');
  document.getElementById('form-title').textContent='Tạo tài khoản mới';
  document.getElementById('form-sub').textContent='Điền thông tin để tạo tài khoản mới.';
  document.getElementById('f-username').disabled=false;
  document.getElementById('f-submit').textContent='Tạo tài khoản →';
}
function openEdit(username){
  const u=allUsers.find(x=>x.username===username);if(!u)return;
  editingUser=u;
  document.getElementById('form-title').textContent='Chỉnh sửa tài khoản';
  document.getElementById('form-sub').textContent=`Đang sửa: ${u.name} (@${u.username})`;
  document.getElementById('f-name').value=u.name||'';
  document.getElementById('f-username').value=u.username;
  document.getElementById('f-username').disabled=true;
  document.getElementById('f-role').value=u.role||'member';
  document.getElementById('f-status').value=u.status||'active';
  document.getElementById('f-pass').value='';
  document.getElementById('f-submit').textContent='Lưu thay đổi →';
  switchTab('create');
}
function resetForm(){
  ['f-name','f-username','f-pass'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const r=document.getElementById('f-role');if(r)r.value='member';
  const s=document.getElementById('f-status');if(s)s.value='active';
  const u=document.getElementById('f-username');if(u)u.disabled=false;
}
async function saveUser(){
  const name=document.getElementById('f-name').value.trim();
  const username=document.getElementById('f-username').value.trim().toLowerCase();
  const pass=document.getElementById('f-pass').value;
  const role=document.getElementById('f-role').value;
  const status=document.getElementById('f-status').value;
  if(!name||!username){showToast('Vui lòng nhập đầy đủ họ tên và username','error');return;}
  if(!editingUser&&!pass){showToast('Vui lòng nhập mật khẩu','error');return;}
  const btn=document.getElementById('f-submit');btn.disabled=true;btn.textContent='Đang lưu...';
  const payload={type:'user',action:editingUser?'update':'create',username,name,role,status};
  if(pass)payload.password=pass;
  try{
    const j=await fetch(USERS_API,{method:'POST',body:JSON.stringify(payload)}).then(r=>r.json());
    if(j.status==='error'){showToast(j.message||'Lỗi','error');return;}
    showToast(editingUser?'✅ Đã cập nhật tài khoản!':'✅ Đã tạo tài khoản mới!');
    switchTab('list');loadUsers();
  }catch{showToast('❌ Lỗi kết nối','error');}
  finally{btn.disabled=false;btn.textContent=editingUser?'Lưu thay đổi →':'Tạo tài khoản →';}
}
async function toggleStatus(username,cur){
  const ns=cur==='disabled'?'active':'disabled';
  if(!confirm(`${ns==='disabled'?'Vô hiệu hoá':'Kích hoạt'} tài khoản @${username}?`))return;
  try{await fetch(USERS_API,{method:'POST',body:JSON.stringify({type:'user',action:'update',username,status:ns})});showToast('✅ Đã cập nhật');loadUsers();}
  catch{showToast('❌ Lỗi','error');}
}
async function deleteUser(username){
  if(!confirm(`Xóa vĩnh viễn @${username}? Không thể hoàn tác.`))return;
  try{await fetch(USERS_API,{method:'POST',body:JSON.stringify({type:'user',action:'delete',username})});showToast('✅ Đã xóa');loadUsers();}
  catch{showToast('❌ Lỗi','error');}
}
async function changeMyPass(){
  const np=document.getElementById('my-newpass').value.trim();
  if(!np||np.length<6){showToast('Mật khẩu tối thiểu 6 ký tự','error');return;}
  const me=Auth.get();
  try{await fetch(USERS_API,{method:'POST',body:JSON.stringify({type:'user',action:'update',username:me.username,password:np})});showToast('✅ Đã đổi mật khẩu!');document.getElementById('my-newpass').value='';}
  catch{showToast('❌ Lỗi','error');}
}
document.addEventListener('DOMContentLoaded',bootUsers);

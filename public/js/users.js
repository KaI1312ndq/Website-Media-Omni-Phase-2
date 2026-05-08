const USERS_API='https://script.google.com/macros/s/AKfycbyWzVCwfiq4DzWn77Edw5t2suKwm4Vlpvmz5lnSndBXi60-pqy7cgVBLQ9ZflABEujP/exec';

// Permission definitions
const PERMS = [
  { section:'Quiz & Learning', items:[
    { key:'quiz_view',  ico:'📝', name:'Quiz Hub',       desc:'Làm bài kiểm tra kiến thức' },
    { key:'quiz_score', ico:'📊', name:'Xem điểm team',  desc:'Xem bảng điểm tất cả thành viên' },
  ]},
  { section:'Daily Tasks', items:[
    { key:'tasks_view',   ico:'📅', name:'Xem task',    desc:'Xem task được assign' },
    { key:'tasks_create', ico:'➕', name:'Tạo task',    desc:'Tạo và assign task cho người khác' },
  ]},
  { section:'Blog & Content', items:[
    { key:'blog_view',    ico:'📖', name:'Xem blog',     desc:'Đọc bài viết nội bộ' },
    { key:'blog_write',   ico:'✏️', name:'Viết bài',     desc:'Tạo và chỉnh sửa bài viết' },
    { key:'blog_publish', ico:'🚀', name:'Publish',      desc:'Xuất bản bài viết công khai' },
    { key:'blog_delete',  ico:'🗑️', name:'Xóa bài',      desc:'Xóa bài viết đã đăng' },
  ]},
  { section:'Quản trị', items:[
    { key:'admin_users', ico:'👥', name:'Quản lý tài khoản', desc:'Tạo, sửa, phân quyền user', locked:true },
    { key:'admin_scores',ico:'📈', name:'Analytics',         desc:'Thống kê toàn team', locked:true },
  ]},
];

// Default permissions by role
const ROLE_DEFAULTS = {
  admin:  { quiz_view:1, quiz_score:1, tasks_view:1, tasks_create:1, blog_view:1, blog_write:1, blog_publish:1, blog_delete:1, admin_users:1, admin_scores:1 },
  member: { quiz_view:1, quiz_score:0, tasks_view:1, tasks_create:0, blog_view:1, blog_write:1, blog_publish:1, blog_delete:0, admin_users:0, admin_scores:0 },
  upbase: { quiz_view:1, quiz_score:0, tasks_view:0, tasks_create:0, blog_view:0, blog_write:0, blog_publish:0, blog_delete:0, admin_users:0, admin_scores:0 },
};

let allUsers=[], selectedUser=null, curPerms={}, filterRole='ALL', searchQ='', editingId=null;

function bootUsers(){
  const u=Auth.get()||(()=>{try{return JSON.parse(localStorage.getItem('mo_persist'));}catch{}})();
  if(!u){location.href='/';return;}
  if(u.role!=='admin'){location.href='/dashboard';return;}
  Auth.set(u); localStorage.setItem('mo_persist',JSON.stringify(u));
  loadUsers();
}

async function loadUsers(){
  document.getElementById('um-user-list').innerHTML='<div class="um-loading">⏳ Đang tải...</div>';
  try{
    const j=await fetch(USERS_API+'?type=users').then(r=>r.json());
    allUsers=j.users||[];
    renderUserList();
  }catch{
    document.getElementById('um-user-list').innerHTML='<div class="um-loading">❌ Không tải được.</div>';
  }
}

function ini(name){ return name.split(' ').slice(-2).map(w=>w[0]).join('').toUpperCase(); }

function renderUserList(){
  const filtered=allUsers.filter(u=>{
    const roleOk=filterRole==='ALL'||u.role===filterRole;
    const searchOk=!searchQ||u.name?.toLowerCase().includes(searchQ)||u.username?.toLowerCase().includes(searchQ);
    return roleOk&&searchOk;
  });
  const list=document.getElementById('um-user-list');
  if(!filtered.length){list.innerHTML='<div class="um-loading">Không tìm thấy.</div>';return;}
  list.innerHTML=filtered.map(u=>{
    const avCls=u.role==='admin'?'av-admin':u.role==='upbase'?'av-upbase':'av-member';
    const bCls=u.status==='disabled'?'uib-disabled':u.role==='admin'?'uib-admin':u.role==='upbase'?'uib-upbase':'uib-member';
    const bLbl=u.status==='disabled'?'OFF':u.role;
    const active=selectedUser?.username===u.username?' active':'';
    return `<div class="um-user-item${active}" onclick="selectUser('${u.username}')">
      <div class="um-av ${avCls}">${ini(u.name||u.username)}</div>
      <div style="flex:1;min-width:0">
        <div class="um-ui-name">${u.name||u.username}</div>
        <div class="um-ui-user">@${u.username}</div>
      </div>
      <span class="um-ui-badge ${bCls}">${bLbl}</span>
    </div>`;
  }).join('');
}

function setUFilter(role,btn){
  filterRole=role;
  document.querySelectorAll('.umf').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderUserList();
}

function filterUsers(){ searchQ=document.getElementById('um-search').value.toLowerCase(); renderUserList(); }

function selectUser(username){
  selectedUser=allUsers.find(u=>u.username===username);
  if(!selectedUser)return;
  // Load perms — use stored perms or role defaults
  const stored = selectedUser.perms ? JSON.parse(selectedUser.perms) : null;
  curPerms = stored || {...ROLE_DEFAULTS[selectedUser.role||'member']};
  renderUserList();
  renderDetail();
}

function renderDetail(){
  const u=selectedUser;
  if(!u)return;
  const avCls=u.role==='admin'?'av-admin':u.role==='upbase'?'av-upbase':'av-member';
  const rCls=u.role==='admin'?'rp-admin':u.role==='upbase'?'rp-upbase':'rp-member';
  const sCls=u.status==='disabled'?'sp-disabled':'sp-active';

  let html=`<div class="um-detail">
    <div class="um-detail-hdr">
      <div class="um-detail-av ${avCls}">${ini(u.name||u.username)}</div>
      <div style="flex:1">
        <div class="um-detail-name">${u.name||u.username}</div>
        <div class="um-detail-meta">
          <span class="um-detail-username">@${u.username}</span>
          <span class="role-pill ${rCls}">${u.role}</span>
          <span class="role-pill ${sCls}">${u.status==='disabled'?'Disabled':'Active'}</span>
        </div>
      </div>
      <div class="um-detail-actions">
        <button class="ud-btn" onclick="quickEdit('${u.username}')">✏️ Sửa</button>
        <button class="ud-btn ud-btn-danger" onclick="toggleStatus('${u.username}','${u.status}')">${u.status==='disabled'?'Bật':'Tắt'}</button>
        ${u.username!==Auth.get()?.username?`<button class="ud-btn ud-btn-danger" onclick="deleteUser('${u.username}')">Xóa</button>`:''}
      </div>
    </div>

    <!-- Role selector -->
    <div style="font-family:var(--f-mono);font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--faint);margin-bottom:10px">Role</div>
    <div class="role-selector" style="margin-bottom:24px">
      ${['admin','member','upbase'].map(r=>`
        <div class="role-opt${u.role===r?' selected-'+r:''}" onclick="changeRole('${r}',this)">
          <div class="ro-ico">${r==='admin'?'👑':r==='member'?'⚡':'🏢'}</div>
          <div class="ro-name" style="color:${r==='admin'?'var(--error)':r==='member'?'var(--blue)':'var(--success)'}">${r}</div>
          <div class="ro-desc">${r==='admin'?'Toàn quyền':r==='member'?'Truy cập cơ bản':'Xem quiz'}</div>
        </div>`).join('')}
    </div>

    <!-- Permissions -->
    <div style="font-family:var(--f-mono);font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--faint);margin-bottom:14px">Phân quyền tính năng</div>
    ${PERMS.map(sec=>`
      <div class="perm-section">
        <div class="perm-section-title">${sec.section}</div>
        <div class="perm-grid">
          ${sec.items.map(p=>{
            const isChecked=!!curPerms[p.key];
            const isLocked=!!p.locked;
            return `<div class="perm-item${isChecked?' checked':''}${isLocked?' locked':''}" onclick="${isLocked?'':' togglePerm(\''+p.key+'\')'}" title="${isLocked?'Chỉ Admin mới có quyền này':''}">
              <div class="perm-checkbox"></div>
              <div style="flex:1">
                <div class="perm-name">${p.ico} ${p.name}</div>
                <div class="perm-desc">${p.desc}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`).join('')}

    <!-- Change password -->
    <div class="pass-section">
      <h4>🔑 Đặt lại mật khẩu</h4>
      <div class="pass-grid">
        <div><label class="fp-label">Mật khẩu mới</label><input class="fp-input" id="new-pass" type="password" placeholder="Tối thiểu 6 ký tự"></div>
        <div><label class="fp-label">Xác nhận</label><input class="fp-input" id="cfm-pass" type="password" placeholder="Nhập lại mật khẩu"></div>
        <div style="display:flex;align-items:flex-end"><button class="pass-save-btn" onclick="resetPass()">Đặt lại mật khẩu</button></div>
      </div>
    </div>

    <!-- Save bar -->
    <div class="save-bar">
      <span>Nhấn lưu để áp dụng thay đổi quyền</span>
      <button class="ud-btn ud-btn-primary" onclick="savePerms()">💾 Lưu thay đổi</button>
    </div>
  </div>`;

  document.getElementById('um-right').innerHTML=html;
}

function togglePerm(key){
  curPerms[key]=curPerms[key]?0:1;
  // Re-render just the perm items
  document.querySelectorAll('.perm-item').forEach(el=>{
    const onclick=el.getAttribute('onclick')||'';
    const m=onclick.match(/togglePerm\('([^']+)'\)/);
    if(m&&m[1]===key) el.classList.toggle('checked',!!curPerms[key]);
  });
}

function changeRole(role,clicked){
  selectedUser.role=role;
  // Reset perms to role defaults
  curPerms={...ROLE_DEFAULTS[role]};
  document.querySelectorAll('.role-opt').forEach(el=>el.className='role-opt');
  clicked.classList.add('selected-'+role);
  renderDetail();
}

async function savePerms(){
  if(!selectedUser)return;
  const btn=document.querySelector('.ud-btn-primary');
  if(btn){btn.disabled=true;btn.textContent='Đang lưu...';}
  try{
    await fetch(USERS_API,{method:'POST',body:JSON.stringify({
      type:'user',action:'update',
      username:selectedUser.username,
      role:selectedUser.role,
      perms:JSON.stringify(curPerms)
    })});
    // Update local
    const idx=allUsers.findIndex(u=>u.username===selectedUser.username);
    if(idx>=0){allUsers[idx].role=selectedUser.role;allUsers[idx].perms=JSON.stringify(curPerms);}
    showToast('✅ Đã lưu phân quyền!');
    renderUserList();
  }catch{showToast('❌ Lỗi lưu','error');}
  finally{if(btn){btn.disabled=false;btn.textContent='💾 Lưu thay đổi';}}
}

async function resetPass(){
  const np=document.getElementById('new-pass').value.trim();
  const cp=document.getElementById('cfm-pass').value.trim();
  if(!np||np.length<6){showToast('Mật khẩu tối thiểu 6 ký tự','error');return;}
  if(np!==cp){showToast('Mật khẩu xác nhận không khớp','error');return;}
  try{
    await fetch(USERS_API,{method:'POST',body:JSON.stringify({type:'user',action:'update',username:selectedUser.username,password:np})});
    showToast('✅ Đã đặt lại mật khẩu!');
    document.getElementById('new-pass').value='';
    document.getElementById('cfm-pass').value='';
  }catch{showToast('❌ Lỗi','error');}
}

async function toggleStatus(username,cur){
  const ns=cur==='disabled'?'active':'disabled';
  if(!confirm(`${ns==='disabled'?'Vô hiệu hoá':'Kích hoạt'} tài khoản @${username}?`))return;
  try{
    await fetch(USERS_API,{method:'POST',body:JSON.stringify({type:'user',action:'update',username,status:ns})});
    showToast('✅ Đã cập nhật');
    const idx=allUsers.findIndex(u=>u.username===username);
    if(idx>=0){allUsers[idx].status=ns;if(selectedUser?.username===username)selectedUser.status=ns;}
    renderUserList(); renderDetail();
  }catch{showToast('❌ Lỗi','error');}
}

async function deleteUser(username){
  if(!confirm(`Xóa vĩnh viễn @${username}?`))return;
  try{
    await fetch(USERS_API,{method:'POST',body:JSON.stringify({type:'user',action:'delete',username})});
    showToast('✅ Đã xóa');
    allUsers=allUsers.filter(u=>u.username!==username);
    selectedUser=null;
    document.getElementById('um-right').innerHTML=`<div class="um-empty-state"><div class="ue-ico">👆</div><div class="ue-title">Chọn thành viên</div><div class="ue-sub">Nhấn vào tên bên trái để xem và chỉnh sửa</div></div>`;
    renderUserList();
  }catch{showToast('❌ Lỗi','error');}
}

function quickEdit(username){
  const u=allUsers.find(x=>x.username===username);if(!u)return;
  editingId=username;
  document.getElementById('f-name').value=u.name||'';
  document.getElementById('f-username').value=u.username;
  document.getElementById('f-username').disabled=true;
  document.getElementById('f-role').value=u.role||'member';
  document.getElementById('f-status').value=u.status||'active';
  document.getElementById('f-pass').value='';
  document.getElementById('f-pass').placeholder='Để trống = giữ nguyên';
  document.getElementById('modal-title').textContent='Chỉnh sửa tài khoản';
  document.getElementById('f-submit').textContent='Lưu thay đổi →';
  document.getElementById('create-modal').classList.add('open');
}

function openCreate(){
  editingId=null;
  ['f-name','f-username','f-pass'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f-username').disabled=false;
  document.getElementById('f-role').value='member';
  document.getElementById('f-status').value='active';
  document.getElementById('f-pass').placeholder='Mật khẩu *';
  document.getElementById('modal-title').textContent='Tạo tài khoản mới';
  document.getElementById('f-submit').textContent='Tạo tài khoản →';
  document.getElementById('create-modal').classList.add('open');
}

function closeCreate(){
  document.getElementById('create-modal').classList.remove('open');
  editingId=null;
}

async function saveUser(){
  const name=document.getElementById('f-name').value.trim();
  const username=document.getElementById('f-username').value.trim().toLowerCase();
  const pass=document.getElementById('f-pass').value;
  const role=document.getElementById('f-role').value;
  const status=document.getElementById('f-status').value;
  if(!name||!username){showToast('Vui lòng nhập đủ thông tin','error');return;}
  if(!editingId&&!pass){showToast('Vui lòng nhập mật khẩu','error');return;}
  const btn=document.getElementById('f-submit');btn.disabled=true;btn.textContent='Đang lưu...';
  const payload={type:'user',action:editingId?'update':'create',username,name,role,status};
  if(pass)payload.password=pass;
  if(!editingId)payload.perms=JSON.stringify({...ROLE_DEFAULTS[role]});
  try{
    const j=await fetch(USERS_API,{method:'POST',body:JSON.stringify(payload)}).then(r=>r.json());
    if(j.status==='error'){showToast(j.message||'Lỗi','error');return;}
    showToast(editingId?'✅ Đã cập nhật!':'✅ Đã tạo tài khoản mới!');
    closeCreate(); loadUsers();
  }catch{showToast('❌ Lỗi kết nối','error');}
  finally{btn.disabled=false;btn.textContent=editingId?'Lưu thay đổi →':'Tạo tài khoản →';}
}

document.addEventListener('DOMContentLoaded',bootUsers);

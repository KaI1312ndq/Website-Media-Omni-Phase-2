/* ═══════════════════════════════════════
   MEDIA OMNI — TASKS JS
   Daily Tasks · Team Calendar · Create
═══════════════════════════════════════ */
let CU=null,curDate=new Date(),curWeekOff=0,allTasks=[],todayTasks=[];
const days=['CN','T2','T3','T4','T5','T6','T7'];
const priLabel={high:'Cao',medium:'Trung bình',low:'Thấp'};
const priCls={high:'pri-high',medium:'pri-medium',low:'pri-low'};
const cardCls={high:'tc-high',medium:'tc-medium',low:'tc-low'};
const dotClr={high:'var(--error)',medium:'var(--warning)',low:'var(--success)'};
const miniCls={high:'ctm-h',medium:'ctm-m',low:'ctm-l'};
const fmtDK=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtShort=d=>d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'});
const fmtTime=val=>{if(!val)return'';try{const d=new Date(val);if(isNaN(d))return val;return String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');}catch{return val;}};
const ini=name=>name.split(' ').slice(-2).map(w=>w[0]).join('').toUpperCase();

function boot(){
  CU=Auth.get();
  if(!CU){location.href='/dashboard.html';return;}
  document.getElementById('nav-user').textContent=CU.name;
  renderRoot();
  updateDateDisplay();
  loadMyDay();
  initAssigneeSelect();
}

function renderRoot(){
  document.getElementById('tasks-root').innerHTML=`
  <!-- MY DAY -->
  <div id="myday-page" class="t-page on">
    <div class="date-bar">
      <h1>My Day — <span id="md-day-label"></span></h1>
      <div class="date-nav">
        <button class="date-btn" onclick="changeDate(-1)">←</button>
        <span class="date-label" id="md-date-full"></span>
        <button class="date-btn" onclick="changeDate(1)">→</button>
        <button class="date-today-btn" onclick="goToday()">Hôm nay</button>
      </div>
    </div>
    <div class="myday-grid">
      <div class="timeline-card">
        <div class="tl-head"><span class="tl-title">Timeline trong ngày</span><span class="tl-count" id="tl-count">0 tasks</span></div>
        <div class="tl-body" id="tl-body"><div class="t-loading">⏳ Đang tải...</div></div>
      </div>
      <div class="t-sidebar">
        <div class="t-scard">
          <div class="t-scard-title">Tiến độ hôm nay</div>
          <div class="prog-ring">
            <div class="pr-wrap">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" stroke-width="8"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--blue)" stroke-width="8"
                  stroke-dasharray="251" stroke-dashoffset="251" id="prog-circle" stroke-linecap="round" style="transition:stroke-dashoffset .6s"/>
              </svg>
              <div class="pr-txt"><div class="pr-pct" id="prog-pct">0%</div><div class="pr-lbl">Hoàn thành</div></div>
            </div>
          </div>
          <div class="stat-2">
            <div class="stat-cell"><div class="stat-v" id="s-done">0</div><div class="stat-l">Xong</div></div>
            <div class="stat-cell"><div class="stat-v" id="s-left">0</div><div class="stat-l">Còn lại</div></div>
          </div>
        </div>
        <div class="t-scard">
          <div class="t-scard-title">Sắp tới hôm nay</div>
          <div id="upcoming-list"><div class="t-loading">Đang tải...</div></div>
        </div>
      </div>
    </div>
  </div>
  <!-- TEAM -->
  <div id="team-page" class="t-page">
    <div class="date-bar">
      <h1>Team <span>Calendar</span></h1>
      <div class="date-nav">
        <button class="date-btn" onclick="changeWeek(-1)">←</button>
        <span class="date-label" id="wk-label">Tuần này</span>
        <button class="date-btn" onclick="changeWeek(1)">→</button>
        <button class="date-today-btn" onclick="goThisWeek()">Tuần này</button>
      </div>
    </div>
    <div id="cal-wrap"><div class="t-loading">⏳ Đang tải...</div></div>
  </div>
  <!-- CREATE -->
  <div id="create-page" class="t-page">
    <div class="form-card">
      <h2>Tạo task mới</h2>
      <p>Assign task cho bản thân hoặc thành viên khác trong team.</p>
      <div class="form-grid">
        <div class="fg-full"><label class="form-label">Tên task *</label><input class="form-input" id="f-task" type="text" placeholder="VD: Review creative TikTok Shop Vitabiotics"></div>
        <div class="fg-full"><label class="form-label">Mô tả chi tiết</label><textarea class="form-input" id="f-desc" placeholder="Ghi chú thêm nếu cần..."></textarea></div>
        <div><label class="form-label">Assign cho *</label><select class="form-input" id="f-assignee"></select></div>
        <div><label class="form-label">Ngày *</label><input class="form-input" id="f-date" type="date"></div>
        <div><label class="form-label">Giờ bắt đầu</label><input class="form-input" id="f-start" type="time" value="09:00"></div>
        <div><label class="form-label">Giờ kết thúc</label><input class="form-input" id="f-end" type="time" value="10:00"></div>
        <div class="fg-full"><label class="form-label">Mức độ ưu tiên</label>
          <select class="form-input" id="f-pri">
            <option value="high">🔴 Cao — Cần làm ngay</option>
            <option value="medium" selected>🟡 Trung bình — Trong ngày</option>
            <option value="low">🟢 Thấp — Khi rảnh</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="form-cancel" onclick="switchTab('myday',document.querySelectorAll('.nav-link')[0])">Huỷ</button>
        <button class="form-submit" id="f-submit" onclick="createTask()">Tạo task →</button>
      </div>
    </div>
  </div>
  <!-- POPUP -->
  <div class="popup-overlay" id="task-popup">
    <div class="popup-card">
      <div class="popup-title" id="pu-title"></div>
      <div class="popup-row"><span class="popup-lbl">Assignee</span><span class="popup-val" id="pu-assignee"></span></div>
      <div class="popup-row"><span class="popup-lbl">Thời gian</span><span class="popup-val" id="pu-time"></span></div>
      <div class="popup-row"><span class="popup-lbl">Ưu tiên</span><span class="popup-val" id="pu-pri"></span></div>
      <div class="popup-row"><span class="popup-lbl">Tạo bởi</span><span class="popup-val" id="pu-by"></span></div>
      <div class="popup-row" id="pu-desc-row" style="display:none"><span class="popup-lbl">Mô tả</span><span class="popup-val" id="pu-desc"></span></div>
      <button class="popup-close" onclick="closePopup()">Đóng</button>
    </div>
  </div>`;
}

function switchTab(tab,btn){
  document.querySelectorAll('.t-page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.nav-link').forEach(b=>b.classList.remove('active'));
  document.getElementById(tab+'-page').classList.add('on');
  if(btn)btn.classList.add('active');
  if(tab==='myday')loadMyDay();
  if(tab==='team')loadTeamCal();
}

function updateDateDisplay(){
  document.getElementById('md-day-label').textContent=days[curDate.getDay()];
  document.getElementById('md-date-full').textContent=fmtShort(curDate)+' / '+curDate.getFullYear();
}
function changeDate(n){curDate=new Date(curDate);curDate.setDate(curDate.getDate()+n);updateDateDisplay();loadMyDay();}
function goToday(){curDate=new Date();updateDateDisplay();loadMyDay();}

async function loadMyDay(){
  updateDateDisplay();
  document.getElementById('tl-body').innerHTML='<div class="t-loading">⏳ Đang tải...</div>';
  try{
    const r=await fetch(`${GS_TASK_URL}?type=tasks&assignee=${CU.username}`);
    const j=await r.json();
    todayTasks=(j.data||[]).filter(t=>{
      if(!t['Ngày'])return false;
      return fmtDK(new Date(t['Ngày']))===fmtDK(curDate);
    });
    renderTimeline(todayTasks);renderSidebar(todayTasks);
  }catch{
    document.getElementById('tl-body').innerHTML='<div class="t-loading">❌ Không tải được dữ liệu.</div>';
  }
}

function renderTimeline(tasks){
  const hours=['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
  document.getElementById('tl-count').textContent=tasks.length+' task'+(tasks.length!==1?'s':'');
  const noTime=tasks.filter(t=>!t['Giờ bắt đầu']);
  let html='';
  if(noTime.length){
    html+=`<div style="padding:6px 16px 4px;font-family:var(--f-mono);font-size:.62rem;font-weight:700;color:var(--faint);text-transform:uppercase;letter-spacing:.08em">Không có giờ cụ thể</div>`;
    noTime.forEach(t=>{html+=renderCard(t);});
    html+=`<div style="height:1px;background:var(--border);margin:10px 0"></div>`;
  }
  hours.forEach(h=>{
    const slot=tasks.filter(t=>t['Giờ bắt đầu']&&fmtTime(t['Giờ bắt đầu'])===h);
    html+=`<div class="tl-slot">
      <div class="tl-time">${h}</div>
      <div class="tl-line"></div>
      <div class="tl-tasks">${slot.length?slot.map(t=>renderCard(t)).join(''):'<div class="tl-empty">Trống</div>'}</div>
    </div>`;
  });
  document.getElementById('tl-body').innerHTML=html||`<div class="t-empty"><div class="t-empty-ico">📭</div><div class="t-empty-tt">Không có task nào</div><div class="t-empty-sb">Hôm nay chưa có task được assign cho bạn.</div></div>`;
}

function renderCard(t){
  const done=t['Status']==='done';const pri=t['Priority']||'medium';const id=t['ID']||'';
  return `<div class="task-card ${cardCls[pri]||'tc-medium'} ${done?'done':''}" onclick="showDetail('${id}')">
    <div class="tc-top">
      <div class="tc-check ${done?'checked':''}" onclick="event.stopPropagation();toggleTask('${id}',this)"></div>
      <div class="tc-name">${t['Task']||'—'}</div>
    </div>
    <div class="tc-meta">
      ${t['Giờ bắt đầu']?`<span class="tc-time">⏰ ${fmtTime(t['Giờ bắt đầu'])}${t['Giờ kết thúc']?' – '+fmtTime(t['Giờ kết thúc']):''}</span>`:''}
      <span class="tc-by">${(t['Created Name']||'').split(' ').pop()||'—'}</span>
      <span class="tc-pri ${priCls[pri]||'pri-medium'}">${priLabel[pri]||pri}</span>
    </div>
  </div>`;
}

function renderSidebar(tasks){
  const done=tasks.filter(t=>t['Status']==='done').length;const tot=tasks.length;
  const pct=tot>0?Math.round(done/tot*100):0;
  document.getElementById('prog-circle').style.strokeDashoffset=251-(251*pct/100);
  document.getElementById('prog-pct').textContent=pct+'%';
  document.getElementById('s-done').textContent=done;
  document.getElementById('s-left').textContent=tot-done;
  const now=new Date();const nowHH=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const upcoming=tasks.filter(t=>t['Status']!=='done'&&t['Giờ bắt đầu']&&fmtTime(t['Giờ bắt đầu'])>=nowHH).sort((a,b)=>fmtTime(a['Giờ bắt đầu']).localeCompare(fmtTime(b['Giờ bắt đầu']))).slice(0,5);
  const ul=document.getElementById('upcoming-list');
  ul.innerHTML=upcoming.length?upcoming.map(t=>`<div class="up-item"><div class="up-dot" style="background:${dotClr[t['Priority']||'medium']}"></div><div class="up-name">${t['Task']||'—'}</div><div class="up-time">${fmtTime(t['Giờ bắt đầu'])}</div></div>`).join(''):'<div style="font-size:.8rem;color:var(--faint)">Không còn task nào hôm nay.</div>';
}

async function toggleTask(id,el){
  if(!id)return;const isDone=el.classList.contains('checked');const ns=isDone?'todo':'done';
  el.classList.toggle('checked');el.closest('.task-card')?.classList.toggle('done',!isDone);
  try{
    await fetch(GS_TASK_URL,{method:'POST',body:JSON.stringify({type:'task_update',id,status:ns})});
    const t=todayTasks.find(x=>x['ID']===id);if(t)t['Status']=ns;
    renderSidebar(todayTasks);showToast(ns==='done'?'✅ Đã hoàn thành!':'↩ Đã mở lại task');
  }catch{showToast('Lỗi cập nhật','error');}
}

function showDetail(id){
  const t=todayTasks.find(x=>x['ID']===id)||allTasks.find(x=>x['ID']===id);
  if(!t)return;
  document.getElementById('pu-title').textContent=t['Task']||'—';
  document.getElementById('pu-assignee').textContent=t['Assignee Name']||t['Assignee']||'—';
  document.getElementById('pu-time').textContent=t['Giờ bắt đầu']?(t['Giờ bắt đầu']+(t['Giờ kết thúc']?' – '+t['Giờ kết thúc']:'')):'Không có giờ';
  document.getElementById('pu-pri').textContent=priLabel[t['Priority']||'medium'];
  document.getElementById('pu-by').textContent=t['Created Name']||'—';
  const desc=t['Mô tả']||'';
  document.getElementById('pu-desc-row').style.display=desc?'flex':'none';
  document.getElementById('pu-desc').textContent=desc;
  document.getElementById('task-popup').classList.add('on');
}
function closePopup(){document.getElementById('task-popup').classList.remove('on');}

async function loadTeamCal(){
  document.getElementById('cal-wrap').innerHTML='<div class="t-loading">⏳ Đang tải...</div>';
  const dates=getWeekDates(curWeekOff);
  const s=fmtShort(dates[0]);const e=fmtShort(dates[4]);
  document.getElementById('wk-label').textContent=`${s} – ${e}`;
  try{
    const results=await Promise.all(dates.map(d=>fetch(`${GS_TASK_URL}?type=tasks&date=${fmtDK(d)}`).then(r=>r.json())));
    allTasks=results.flatMap((r,i)=>(r.data||[]).map(t=>({...t,_date:dates[i]})));
    renderCal(dates,allTasks,CU.role==='admin');
  }catch{document.getElementById('cal-wrap').innerHTML='<div class="t-loading">❌ Không tải được.</div>';}
}
function getWeekDates(off=0){const now=new Date();const day=now.getDay();const mon=new Date(now);mon.setDate(now.getDate()-((day+6)%7)+off*7);return Array.from({length:5},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d;});}
function changeWeek(n){curWeekOff+=n;loadTeamCal();}
function goThisWeek(){curWeekOff=0;loadTeamCal();}

function renderCal(dates,tasks,isAdmin){
  const dayLabels=['T2','T3','T4','T5','T6'];
  const members=isAdmin?Object.entries(MO_USERS).map(([k,v])=>[k,{name:v.name}]):[[CU.username,{name:CU.name}]];
  const cols=`150px repeat(5,1fr)`;
  let html=`<div class="cal-wrap">
    <div class="cal-row-hdr" style="grid-template-columns:${cols}">
      <div class="cal-hdr-cell">Thành viên</div>
      ${dates.map((d,i)=>{const today=fmtDK(d)===fmtDK(new Date());return`<div class="cal-hdr-cell" style="${today?'color:var(--blue);background:var(--border2)':''}">${dayLabels[i]}<br><span style="font-size:.8em;opacity:.7">${fmtShort(d)}</span></div>`;}).join('')}
    </div>`;
  members.forEach(([uname,udata])=>{
    if(!udata)return;
    html+=`<div class="cal-row" style="grid-template-columns:${cols}">
      <div class="cal-member"><div class="cal-av">${ini(udata.name)}</div><span style="font-size:.78rem">${udata.name.split(' ').slice(-2).join(' ')}</span></div>
      ${dates.map(d=>{
        const dk=fmtDK(d);
        const dt=tasks.filter(t=>t['Assignee']===uname&&fmtDK(t._date)===dk);
        return`<div class="cal-cell">${dt.slice(0,3).map(t=>`<div class="cal-task-mini ${miniCls[t['Priority']||'medium']}" onclick="showDetailFromAll('${t['ID']}')" title="${t['Task']||''}">${fmtTime(t['Giờ bắt đầu'])?fmtTime(t['Giờ bắt đầu'])+' ':''} ${t['Task']||'—'}</div>`).join('')}${dt.length>3?`<div style="font-size:.62rem;color:var(--faint);padding:.1rem .35rem">+${dt.length-3}</div>`:''}</div>`;
      }).join('')}
    </div>`;
  });
  html+='</div>';
  document.getElementById('cal-wrap').innerHTML=html;
}
function showDetailFromAll(id){const t=allTasks.find(x=>x['ID']===id);if(t){const e=t;document.getElementById('pu-title').textContent=e['Task']||'—';document.getElementById('pu-assignee').textContent=e['Assignee Name']||'—';document.getElementById('pu-time').textContent=e['Giờ bắt đầu']||(e['Giờ kết thúc']?' – '+e['Giờ kết thúc']:'');document.getElementById('pu-pri').textContent=priLabel[e['Priority']||'medium'];document.getElementById('pu-by').textContent=e['Created Name']||'—';document.getElementById('pu-desc-row').style.display='none';document.getElementById('task-popup').classList.add('on');}}

function initAssigneeSelect(){
  const sel=document.getElementById('f-assignee');if(!sel)return;
  sel.innerHTML=Object.entries(MO_USERS).map(([k,v])=>`<option value="${k}" ${k===CU.username?'selected':''}>${v.name}</option>`).join('');
  document.getElementById('f-date').value=todayKey();
}
async function createTask(){
  const task=document.getElementById('f-task').value.trim();
  const date=document.getElementById('f-date').value;
  if(!task){showToast('Vui lòng nhập tên task','error');return;}
  if(!date){showToast('Vui lòng chọn ngày','error');return;}
  const btn=document.getElementById('f-submit');btn.disabled=true;btn.textContent='Đang lưu...';
  const assignee=document.getElementById('f-assignee').value;
  const payload={type:'task',task,desc:document.getElementById('f-desc').value.trim(),assignee,assigneeName:MO_USERS[assignee]?.name||assignee,date,timeStart:document.getElementById('f-start').value,timeEnd:document.getElementById('f-end').value,priority:document.getElementById('f-pri').value,createdBy:CU.username,createdName:CU.name};
  try{
    const r=await fetch(GS_TASK_URL,{method:'POST',body:JSON.stringify(payload)});
    const j=await r.json();
    if(j.status==='ok'){
      showToast('✅ Task đã được tạo!');
      document.getElementById('f-task').value='';document.getElementById('f-desc').value='';
      setTimeout(()=>switchTab('myday',document.querySelectorAll('.nav-link')[0]),1500);
    }else throw new Error();
  }catch{showToast('Lỗi tạo task','error');}
  finally{btn.disabled=false;btn.textContent='Tạo task →';}
}
const todayKey=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
document.addEventListener('DOMContentLoaded',boot);

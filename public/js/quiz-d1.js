/* ═══════════════════════════════════════
   MEDIA OMNI — QUIZ D1 JS
   Benchmark Ads Engine + Data (~36 rows)
═══════════════════════════════════════ */

const DATA=[
  {p:"TikTok",o:"Reach",c:"—",a:"Lượt hiển thị",CPA:10,CPC:null,CPM:10000,CTR:null,CR:null},
  {p:"TikTok",o:"Traffic",c:"Website/App",a:"Lượt click",CPA:null,CPC:100,CPM:30000,CTR:10,CR:null},
  {p:"TikTok",o:"Community interaction",c:"—",a:"Lượt follow",CPA:2500,CPC:null,CPM:200000,CTR:null,CR:null},
  {p:"TikTok",o:"Community interaction",c:"—",a:"Lượt view video",CPA:12,CPC:null,CPM:14000,CTR:null,CR:null},
  {p:"TikTok",o:"Sales",c:"Website",a:"Purchase",CPA:50000,CPC:3000,CPM:50000,CTR:3,CR:2},
  {p:"TikTok",o:"Sales",c:"PGM",a:"GMV tổng",CPA:60000,CPC:1500,CPM:80000,CTR:1,CR:3},
  {p:"TikTok",o:"Sales",c:"LGM",a:"GMV tổng",CPA:50000,CPC:2000,CPM:40000,CTR:3,CR:5},
  {p:"Meta",o:"Awareness",c:"—",a:"Reach",CPA:20000,CPC:null,CPM:15000,CTR:null,CR:null},
  {p:"Meta",o:"Traffic",c:"Website/App",a:"Link click",CPA:500,CPC:500,CPM:15000,CTR:5,CR:null},
  {p:"Meta",o:"Engagement",c:"Post/Video",a:"Like/Comment/Share",CPA:900,CPC:null,CPM:18000,CTR:null,CR:null},
  {p:"Meta",o:"Engagement",c:"Post/Video",a:"ThruPlay 15s",CPA:100,CPC:null,CPM:18000,CTR:null,CR:null},
  {p:"Meta",o:"Engagement",c:"Page",a:"Page like",CPA:2500,CPC:null,CPM:35000,CTR:null,CR:null},
  {p:"Meta",o:"Leads",c:"Instant form",a:"Form submit",CPA:50000,CPC:500,CPM:35000,CTR:5,CR:25},
  {p:"Meta",o:"Leads",c:"Website",a:"Web lead submit",CPA:70000,CPC:500,CPM:35000,CTR:5,CR:40},
  {p:"Meta",o:"Leads",c:"Messenger",a:"Conversation start",CPA:25000,CPC:2500,CPM:45000,CTR:2.5,CR:null},
  {p:"Meta",o:"Sales",c:"Website",a:"Purchase",CPA:50000,CPC:3000,CPM:70000,CTR:3,CR:2.2},
  {p:"Meta",o:"Sales",c:"Messenger",a:"Purchase via chat",CPA:70000,CPC:5000,CPM:100000,CTR:2,CR:5},
  {p:"Meta",o:"Sales",c:"CPAS Shopee",a:"Purchase",CPA:30000,CPC:1500,CPM:50000,CTR:3,CR:2},
  {p:"Shopee",o:"Ads Product",c:"CPC Search",a:"Purchase",CPA:40000,CPC:2100,CPM:40000,CTR:2.3,CR:5},
  {p:"Shopee",o:"New Product",c:"New Product",a:"Purchase",CPA:75000,CPC:3000,CPM:35000,CTR:1.9,CR:4},
  {p:"Shopee",o:"Branding",c:"—",a:"Purchase",CPA:80000,CPC:8000,CPM:1000000,CTR:6,CR:10},
  {p:"Shopee",o:"Ads Shop",c:"Tăng nhận diện",a:"Purchase",CPA:67500,CPC:4500,CPM:45000,CTR:5,CR:6},
  {p:"Shopee",o:"Ads Shop",c:"Giá thầu tự động",a:"Purchase",CPA:76000,CPC:3800,CPM:40000,CTR:4,CR:5},
  {p:"Shopee",o:"Ads Live",c:"Thủ công",a:"Purchase",CPA:50000,CPC:null,CPM:60000,CTR:null,CR:null},
  {p:"Shopee",o:"Ads Live",c:"Tối ưu lượt xem",a:"Live View",CPA:50,CPC:null,CPM:40000,CTR:null,CR:null},
  {p:"Google",o:"Sales",c:"Search Ads",a:"Conversion",CPA:50000,CPC:3000,CPM:140000,CTR:5.5,CR:3.5},
  {p:"Google",o:"Sales",c:"Shopping Ads",a:"Purchase",CPA:50000,CPC:2000,CPM:80000,CTR:5,CR:3.2},
  {p:"Google",o:"Sales",c:"PMax",a:"Purchase",CPA:50000,CPC:1000,CPM:50000,CTR:6,CR:2.5},
  {p:"Google",o:"Traffic",c:"Display/GDN",a:"Click",CPA:null,CPC:100,CPM:10000,CTR:10,CR:null},
  {p:"Google",o:"Awareness",c:"YT Non-skip",a:"Impression",CPA:15,CPC:null,CPM:15000,CTR:null,CR:null},
  {p:"Google",o:"Awareness",c:"YT Skippable",a:"View 30s",CPA:200,CPC:null,CPM:35000,CTR:null,CR:null},
  {p:"Google",o:"Awareness",c:"YT Bumper 6s",a:"Impression",CPA:15,CPC:null,CPM:15000,CTR:null,CR:null},
  {p:"Google",o:"Local",c:"Local Campaign",a:"Direction click",CPA:20000,CPC:4000,CPM:150000,CTR:5,CR:null},
  {p:"Google",o:"Local",c:"Local Campaign",a:"Call click",CPA:50000,CPC:5000,CPM:150000,CTR:5,CR:null},
];

const METRICS=["CPA","CPC","CPM","CTR","CR"];
const MFULL={CPA:"Cost Per Action",CPC:"Cost Per Click",CPM:"CPM (per 1,000 impr.)",CTR:"Click-through Rate",CR:"Conversion Rate"};
const MTIP={CPA:"Chi phí để đạt 1 kết quả (action).",CPC:"Chi phí mỗi click — phản ánh cạnh tranh và chất lượng creative.",CPM:"Chi phí 1,000 lượt hiển thị — cao = audience nhỏ hoặc mùa cao điểm.",CTR:"Click ÷ Impression × 100%. Creative tốt = CTR cao.",CR:"Conversion ÷ Click × 100%. UX và offer quyết định CR."};
const fmt=(m,v)=>{if(v==null)return"—";if(m==="CTR"||m==="CR")return v+"%";return v.toLocaleString("vi-VN")+"đ"};
const shuf=a=>[...a].sort(()=>Math.random()-.5);
const tod=()=>new Date().toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"});

let curP="ALL",curM="ALL",entries={},queue=[],qi=0,retries=[],roundN=1;
let bStr=0,bAtt=0,bFail=0,bTime=0,bTiv=null,bTSec=0,bTMax=30,bDone=false,bStart=null;

function selP(btn,v){document.querySelectorAll('#plat-group .fb').forEach(b=>b.classList.remove('ap'));btn.classList.add('ap');curP=v;}
function selM(btn,v){document.querySelectorAll('#metric-group .fb').forEach(b=>b.classList.remove('ap'));btn.classList.add('ap');curM=v;}

function makeOpts(m,correct,row){
  const pool=[...new Set(DATA.filter(r=>r!==row&&r[m]!=null&&r[m]!==correct).map(r=>r[m]))];
  const d=shuf(pool).slice(0,3);
  while(d.length<3){const rv=correct*(0.5+Math.random());const rnd=Math.round(rv/100)*100||Math.round(rv*10)/10;if(rnd!==correct&&!d.includes(rnd))d.push(rnd);}
  return shuf([correct,...d]);
}
function makeRevOpts(m,tRow){
  const pool=DATA.filter(r=>r[m]!=null&&r!==tRow);
  const d=shuf(pool).slice(0,3).map(r=>({l:`${r.p} · ${r.c} · ${r.a}`,v:r}));
  return shuf([{l:`${tRow.p} · ${tRow.c} · ${tRow.a}`,v:tRow},...d]);
}

function buildEntries(){
  entries={};
  const filtered=DATA.filter(r=>curP==="ALL"||r.p===curP);
  const metrics=curM==="ALL"?METRICS:[curM];
  filtered.forEach(row=>{
    metrics.forEach(m=>{
      if(row[m]==null)return;
      const id=`${row.p}_${row.o}_${row.c}_${row.a}_${m}`;
      entries[id]={row,metric:m,rev:false,attempts:0,failCount:0,mastered:false,ci:0,opts:[]};
      entries[id+'_rev']={row,metric:m,rev:true,attempts:0,failCount:0,mastered:false,ci:0,opts:[]};
    });
  });
}

function startBench(){
  buildEntries();queue=shuf(Object.keys(entries));qi=0;retries=[];roundN=1;
  bStr=0;bAtt=0;bFail=0;bTime=0;bStart=Date.now();
  document.getElementById('bench-setup').style.display='none';
  document.getElementById('bench-result').style.display='none';
  document.getElementById('bench-quiz').style.display='block';
  document.getElementById('p-plat').textContent=curP;
  refreshSC();renderBQ();
}

function renderBQ(){
  bDone=false;
  ['n-retry','n-timeout','exp-box','bv-box','btn-next','streak-flash'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.style.display='none';
  });
  document.getElementById('n-retry').style.display=retries.includes(queue[qi])?'block':'none';
  const id=queue[qi];const e=entries[id];const row=e.row;const m=e.metric;
  document.getElementById('b-round').textContent=roundN;
  document.getElementById('b-vong').textContent=`Vòng ${roundN}`;
  document.getElementById('b-hard').style.display=e.failCount>=1?'flex':'none';
  document.getElementById('b-plat').textContent=row.p;
  document.getElementById('b-obj').textContent=row.o;
  document.getElementById('b-camp').textContent=row.c;
  document.getElementById('b-act').textContent=row.a;
  document.getElementById('q-rev').style.display=e.rev?'block':'none';
  const tot=Object.keys(entries).length;
  const done=Object.values(entries).filter(x=>x.mastered).length;
  document.getElementById('p-fill').style.width=`${done/tot*100}%`;
  if(!e.rev){
    document.getElementById('b-q').innerHTML=`${MFULL[m]} của <strong>${row.p} · ${row.c||row.o} · ${row.a}</strong> là bao nhiêu?`;
    const opts=makeOpts(m,row[m],row);e.opts=opts;e.ci=opts.indexOf(row[m]);
    document.getElementById('b-opts').innerHTML=opts.map((v,i)=>`<button class="opt" onclick="pickOpt(${i})"><span class="opt-lbl">${['A','B','C','D'][i]}</span>${fmt(m,v)}</button>`).join('');
  }else{
    document.getElementById('b-q').innerHTML=`Platform / Campaign / Action nào có <strong>${MFULL[m]} = ${fmt(m,row[m])}</strong>?`;
    const opts=makeRevOpts(m,row);e.opts=opts;e.ci=opts.findIndex(o=>o.v===row);
    document.getElementById('b-opts').innerHTML=opts.map((o,i)=>`<button class="opt" onclick="pickOpt(${i})"><span class="opt-lbl">${['A','B','C','D'][i]}</span>${o.l}</button>`).join('');
  }
  startTimer();
}

function startTimer(){
  clearInterval(bTiv);bTSec=bTMax;
  const fill=document.getElementById('t-fill'),cnt=document.getElementById('t-cnt');
  fill.className='timer-fill tf-ok';fill.style.transition='none';fill.style.width='100%';
  cnt.className='timer-cnt';cnt.textContent=bTSec;
  setTimeout(()=>{
    fill.style.transition='width 1s linear';
    bTiv=setInterval(()=>{
      bTSec--;fill.style.width=`${bTSec/bTMax*100}%`;cnt.textContent=bTSec;
      if(bTSec<=10){fill.className='timer-fill tf-warn';cnt.className='timer-cnt warn';}
      if(bTSec<=0){clearInterval(bTiv);onTimeout();}
    },1000);
  },60);
}

function onTimeout(){
  bDone=true;const id=queue[qi];const e=entries[id];
  e.attempts++;e.failCount++;bAtt++;bFail++;bTime+=bTMax;e.mastered=false;
  if(!retries.includes(id))retries.push(id);refreshSC();
  document.querySelectorAll('#b-opts .opt').forEach((b,i)=>{b.classList.add('disabled');if(i===e.ci)b.classList.add('correct');else b.classList.add('faded');});
  document.getElementById('n-timeout').style.display='block';
  showPost(e,true,null);
  setTimeout(()=>{if(bDone)doNext();},3000);
}

function pickOpt(i){
  if(bDone)return;clearInterval(bTiv);bDone=true;
  const elapsed=bTMax-bTSec;bTime+=elapsed;
  const id=queue[qi];const e=entries[id];const ok=i===e.ci;
  e.attempts++;bAtt++;
  if(ok){bStr++;e.mastered=true;}else{bStr=0;e.mastered=false;e.failCount++;bFail++;if(!retries.includes(id))retries.push(id);}
  if(bStr>=3){const sf=document.getElementById('streak-flash');sf.textContent=`🔥 Streak ${bStr} câu đúng!`;sf.style.display='block';}
  refreshSC();
  document.querySelectorAll('#b-opts .opt').forEach((b,idx)=>{
    b.classList.add('disabled');
    if(idx===e.ci)b.classList.add('correct');
    else if(idx===i&&!ok)b.classList.add('wrong');
    else b.classList.add('faded');
  });
  showPost(e,false,ok?null:i);
}

function showPost(e,isTO,wIdx){
  const m=e.metric;
  const bv=document.getElementById('bv-box');
  if(!e.rev&&(isTO||wIdx!==null)){
    document.getElementById('bv-w').textContent=isTO?"(hết giờ)":fmt(m,e.opts[wIdx]);
    document.getElementById('bv-r').textContent=fmt(m,e.row[m]);
    bv.style.display='block';
  }else{bv.style.display='none';}
  const tip=e.rev?`Đúng: <strong>${e.row.p} · ${e.row.c} · ${e.row.a}</strong><br><br>${MTIP[m]}`:`<strong>${m}: ${fmt(m,e.row[m])}</strong><br><br>${MTIP[m]}`;
  document.getElementById('exp-txt').innerHTML=tip;
  document.getElementById('exp-box').style.display='block';
  const bn=document.getElementById('btn-next');bn.style.display='block';
  const last=qi+1>=queue.length;
  bn.textContent=last&&retries.length===0?'Xem kết quả →':last?'Ôn câu sai →':'Câu tiếp →';
}

function doNext(){
  clearInterval(bTiv);qi++;
  if(qi>=queue.length){
    if(retries.length===0){showBRes();return;}
    roundN++;queue=shuf([...retries]);retries=[];qi=0;
    queue.forEach(id=>{entries[id].mastered=false;});
  }
  renderBQ();
}

function refreshSC(){
  const all=Object.values(entries);const tot=all.length;
  const m=all.filter(e=>e.mastered).length;const w=all.filter(e=>e.attempts>0&&!e.mastered).length;
  document.getElementById('sc-ok').textContent=m;
  document.getElementById('sc-fail').textContent=w;
  document.getElementById('sc-left').textContent=Math.max(0,tot-m-w);
  document.getElementById('sc-str').textContent=bStr;
  document.getElementById('sc-tot').textContent=bFail;
}

function showBRes(){
  clearInterval(bTiv);
  document.getElementById('bench-quiz').style.display='none';
  document.getElementById('bench-result').style.display='block';
  const all=Object.values(entries);const tot=all.length;
  const firstOk=all.filter(e=>e.failCount===0).length;
  const pct=Math.round(firstOk/tot*100);
  const avgT=bAtt>0?Math.round(bTime/bAtt):0;
  const hardQ=all.filter(e=>e.failCount>=2);
  const dur=Math.round((Date.now()-bStart)/60000);
  const g=pct>=90?{e:"🏆",l:"Xuất sắc!",c:"var(--success)"}:pct>=70?{e:"🎯",l:"Khá tốt!",c:"var(--warning)"}:pct>=50?{e:"📈",l:"Trung bình",c:"#f97316"}:{e:"📚",l:"Cần luyện",c:"var(--error)"};
  document.getElementById('br-em').textContent=g.e;
  document.getElementById('br-name').textContent=Auth.get()?.name||'';
  document.getElementById('br-date').textContent=`Benchmark Ads · ${tod()}`;
  document.getElementById('br-score').textContent=pct+'%';
  document.getElementById('br-grade').textContent=g.l;
  document.getElementById('br-grade').style.color=g.c;
  document.getElementById('br-sub').textContent=`${firstOk}/${tot} câu đúng ngay lần đầu`;
  document.getElementById('br-chips').innerHTML=[
    `<span class="chip-c ch-g">Đúng lần đầu: ${firstOk}/${tot}</span>`,
    `<span class="chip-c ch-p">Vòng: ${roundN}</span>`,
    `<span class="chip-c ch-b">Tổng thử: ${bAtt}</span>`,
    `<span class="chip-c ch-y">TB: ${avgT}s</span>`,
    `<span class="chip-c ch-o">Tổng sai: ${bFail}</span>`,
  ].join('');
  const hl=document.getElementById('hard-list');
  if(hardQ.length>0){
    hl.style.display='block';
    document.getElementById('hl-items').innerHTML=hardQ.map(e=>`<div class="hl-item">${e.row.p} · ${e.row.c} · ${e.metric} — sai ${e.failCount} lần</div>`).join('');
  }
  document.getElementById('bd-list').innerHTML=all.map(e=>{
    const pc=e.failCount===0?'bd-ok':e.failCount===1?'bd-1':'bd-2';
    const label=e.failCount===0?'✓ 1 lần':e.failCount===1?'↺ 2 lần':`✗ ${e.attempts} lần`;
    return `<div class="bd-item"><div class="bd-q">${e.row.p} · ${e.row.c}<br><strong>${e.metric}: ${fmt(e.metric,e.row[e.metric])}</strong>${e.rev?' <em style="color:#6366f1;font-size:10px">(ngược)</em>':''}</div><span class="bd-p ${pc}">${label}</span></div>`;
  }).join('');
  // Save
  saveScore({quizType:'Dạng 1 - Benchmark',topic:`Benchmark ${curP} · ${curM}`,score:firstOk,total:tot,pct,duration:dur});
}

window.doCopy=function(){
  const all=Object.values(entries);const tot=all.length;
  const firstOk=all.filter(e=>e.failCount===0).length;const pct=Math.round(firstOk/tot*100);
  const hardQ=all.filter(e=>e.failCount>=2);
  let txt=`[${Auth.get()?.name}] Benchmark Ads — ${tod()}\nPlatform: ${curP} | Metric: ${curM}\nĐúng lần đầu: ${firstOk}/${tot} (${pct}%)\nVòng: ${roundN} | Tổng sai: ${bFail}\n`;
  if(hardQ.length)hardQ.forEach(e=>{txt+=`• ${e.row.p} · ${e.metric} (sai ${e.failCount} lần)\n`;});
  navigator.clipboard.writeText(txt).then(()=>{
    const b=document.getElementById('copy-btn');b.textContent='Đã copy! ✓';b.classList.add('done');
    setTimeout(()=>{b.textContent='Copy kết quả → Lark';b.classList.remove('done');},2500);
  });
};

function showQuit(){clearInterval(bTiv);document.getElementById('quit-popup').classList.add('on');}
function hideQuit(){document.getElementById('quit-popup').classList.remove('on');if(!bDone)startTimer();}
function doQuit(){document.getElementById('quit-popup').classList.remove('on');clearInterval(bTiv);document.getElementById('bench-quiz').style.display='none';document.getElementById('bench-setup').style.display='block';}

async function saveScore(data){
  const u=Auth.get();
  if(!u)return;
  try{
    await fetch(GS_QUIZ_URL,{method:'POST',body:JSON.stringify({type:'quiz',...data,username:u.username,name:u.name,role:u.role})});
    showToast('Đã lưu kết quả ✓','success');
  }catch{showToast('Lưu thất bại','error');}
}

/* MEDIA OMNI — WEEKLY REPORT TOOL JS | DARA Framework | TikTok Shop + Shopee */
const REPORT_API='https://script.google.com/macros/s/AKfycbyRNS6gon5Nyn0Bt9vLpGmbdCJ13gTE8jgz_mhrRYunybgxDdwkcON_bP7SfIHtIL8J/exec';
const METRICS=[
  {key:'doanh_so',name:'Doanh số Ads',unit:'₫',input:true},
  {key:'chi_phi',name:'Chi phí hiển thị',unit:'₫',input:true},
  {key:'roas',name:'ROAS',unit:'x',calc:d=>d.chi_phi?(d.doanh_so/d.chi_phi).toFixed(2):0},
  {key:'cpc',name:'CPC = Chi phí / Lượt click',unit:'₫',calc:d=>d.luot_click?(d.chi_phi/d.luot_click).toFixed(0):0},
  {key:'ctr',name:'CTR',unit:'%',calc:d=>d.luot_xem?(d.luot_click/d.luot_xem*100).toFixed(2):0},
  {key:'cpm',name:'CPM = CP/Lượt xem × 1000',unit:'‰',calc:d=>d.luot_xem?(d.chi_phi/d.luot_xem*1000).toFixed(0):0},
  {key:'cr',name:'CR = Đơn hàng/Lượt click×100',unit:'%',calc:d=>d.luot_click?(d.don_hang/d.luot_click*100).toFixed(2):0},
  {key:'luot_xem',name:'Số lượt xem',unit:'',input:true},
  {key:'luot_click',name:'Số lượt click',unit:'',input:true},
  {key:'don_hang',name:'Số đơn hàng',unit:'',input:true},
  {key:'sp_ban',name:'Sản phẩm đã bán',unit:'',input:true},
  {key:'aov',name:'AOV = Doanh thu / Đơn hàng',unit:'₫',calc:d=>d.don_hang?(d.doanh_so/d.don_hang).toFixed(0):0},
];
const INPUT_KEYS=METRICS.filter(m=>m.input).map(m=>m.key);
let STATE={step:1,store:'',platform:'both',weekInfo:null,shopee:{},tiktok:{},shopee_plan:null,tiktok_plan:null,history:{shopee:[],tiktok:[]},hasPlan:false,user:null};

document.addEventListener('DOMContentLoaded',()=>{
  const u=Auth.get()||(()=>{try{return JSON.parse(localStorage.getItem('mo_persist'));}catch{}})();
  if(!u){location.href='/dashboard';return;}
  Auth.set(u);localStorage.setItem('mo_persist',JSON.stringify(u));
  STATE.user=u;
  document.getElementById('nav-user').textContent=u.name;
  setWeekDefault();renderStep(1);
});

function setWeekDefault(){
  const today=new Date();
  const dow=today.getDay();
  const daysToFriday=(5-dow+7)%7;
  const friday=new Date(today);
  friday.setDate(today.getDate()+(daysToFriday===0?0:daysToFriday));
  const thursday=new Date(friday);
  thursday.setDate(friday.getDate()+6);
  const lastDay=new Date(friday.getFullYear(),friday.getMonth()+1,0);
  const weekEnd=thursday>lastDay?lastDay:thursday;
  const diffDays=Math.round((weekEnd-friday)/(1000*60*60*24))+1;
  const weekNum=getWeekNum(friday);
  const month=friday.getMonth()+1,year=friday.getFullYear(),quarter=Math.ceil(month/3);
  STATE.weekInfo={start:fmtDate(friday),end:fmtDate(weekEnd),startRaw:friday,endRaw:weekEnd,days:diffDays,isFull:diffDays===7,weekNum,month,year,quarter,label:`W${weekNum} Tháng ${month} Quý ${quarter}.${year}`};
}

function getWeekNum(date){
  const d=new Date(date.getFullYear(),date.getMonth(),1);let week=0;
  while(d<=date){if(d.getDay()===5)week++;d.setDate(d.getDate()+1);}
  return week||1;
}

function fmtDate(d){return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;}

function fmtNum(n,unit=''){
  if(n===null||n===undefined||n===''||isNaN(n))return '—';
  const num=parseFloat(n);
  if(unit==='₫'||unit==='')return num.toLocaleString('vi-VN');
  if(unit==='x')return num+'x';
  if(unit==='%')return num+'%';
  if(unit==='‰')return num+'‰';
  return num.toLocaleString('vi-VN');
}

function calcMetrics(raw){
  const d={...raw};
  METRICS.filter(m=>m.calc).forEach(m=>{d[m.key]=m.calc(d);});
  return d;
}

function getPct(actual,plan){
  if(!plan||plan==0)return null;
  return((actual/plan)*100).toFixed(1);
}

function pctClass(pct){
  if(!pct)return '';
  const p=parseFloat(pct);
  if(p>=90)return 'green';
  if(p>=70)return 'yellow';
  return 'red';
}

function renderStep(n){
  STATE.step=n;
  document.querySelectorAll('.step-tab').forEach((t,i)=>{
    t.classList.remove('active','done','disabled');
    if(i+1===n)t.classList.add('active');
    else if(i+1<n)t.classList.add('done');
    else t.classList.add('disabled');
  });
  document.querySelectorAll('.step-page').forEach((p,i)=>{p.style.display=i+1===n?'block':'none';});
  window.scrollTo({top:0,behavior:'smooth'});
}

function goStep(n){renderStep(n);}

function initStep1(){
  const wi=STATE.weekInfo;
  if(!wi)return;
  document.getElementById('week-label-display').textContent=wi.label;
  document.getElementById('week-range-display').textContent=`${wi.start} – ${wi.end}`;
  const daysEl=document.getElementById('week-days-display');
  daysEl.textContent=wi.isFull?'7 ngày':`${wi.days} ngày (tuần lẻ)`;
  daysEl.className=`wd-days ${wi.isFull?'full':'short'}`;
  if(STATE.store)document.getElementById('inp-store').value=STATE.store;
}

function setPlatform(p){
  STATE.platform=p;
  document.querySelectorAll('.plat-btn').forEach(b=>b.classList.remove('active-shopee','active-tiktok','active-both'));
  const map={shopee:'active-shopee',tiktok:'active-tiktok',both:'active-both'};
  document.querySelector(`[data-plat="${p}"]`).classList.add(map[p]);
}

async function nextStep1(){
  const store=document.getElementById('inp-store').value.trim();
  if(!store){showToast('Vui lòng nhập tên Store','error');return;}
  STATE.store=store;
  const{weekInfo,platform,user}=STATE;
  const platforms=platform==='both'?['shopee','tiktok']:[platform];
  showToast('Đang tải dữ liệu...');
  try{
    for(const plat of platforms){
      const planResp=await fetch(`${REPORT_API}?action=getPlan&username=${user.username}&store=${encodeURIComponent(store)}&platform=${plat}&month=${weekInfo.month}&year=${weekInfo.year}`).then(r=>r.json());
      if(plat==='shopee')STATE.shopee_plan=planResp.data?.shopee_plan||null;
      if(plat==='tiktok')STATE.tiktok_plan=planResp.data?.tiktok_plan||null;
      const histResp=await fetch(`${REPORT_API}?action=getWeeklyHistory&username=${user.username}&store=${encodeURIComponent(store)}&platform=${plat}&month=${weekInfo.month}&year=${weekInfo.year}`).then(r=>r.json());
      STATE.history[plat]=histResp.data||[];
    }
    STATE.hasPlan=(platform==='shopee'&&STATE.shopee_plan)||(platform==='tiktok'&&STATE.tiktok_plan)||(platform==='both'&&STATE.shopee_plan&&STATE.tiktok_plan);
    renderStep(2);initStep2();
  }catch(e){showToast('Lỗi tải dữ liệu. Kiểm tra kết nối.','error');}
}

function initStep2(){
  const container=document.getElementById('step2-content');
  const{platform,weekInfo,shopee_plan,tiktok_plan}=STATE;
  const platforms=platform==='both'?['shopee','tiktok']:[platform];
  let html='';
  if(!STATE.hasPlan){
    html+=`<div class="plan-warning"><div class="pw-icon">⚠️</div><div class="pw-text"><strong>Chưa có Plan tháng ${weekInfo.month}/${weekInfo.year}</strong> cho store này.</div><button class="pw-btn" onclick="showPlanModal()">Set Plan</button></div>`;
  }
  platforms.forEach(plat=>{
    const plan=plat==='shopee'?shopee_plan:tiktok_plan;
    const wn=`w${weekInfo.weekNum}`;
    const hist=STATE.history[plat];
    const prevWeeks=hist.filter(h=>h.week_num<weekInfo.weekNum).sort((a,b)=>a.week_num-b.week_num);
    const platName=plat==='shopee'?'🛍️ Shopee Ads':'🎵 TikTok Shop';
    html+=`<div class="r-card"><h2>${platName}</h2><p>Nhập Actual tuần này — ROAS, CTR, CPM, CR, AOV tự tính.</p><table class="metric-table"><thead><tr><th>Metric</th><th class="num">Actual W</th><th class="num">Plan W</th><th class="num">% Plan</th>`;
    prevWeeks.forEach(pw=>{html+=`<th class="num">W${pw.week_num}</th>`;});
    html+=`<th class="num">Plan T</th></tr></thead><tbody>`;
    METRICS.forEach(m=>{
      const planW=plan?.[m.key]?.[wn]||null;
      const planMo=plan?.[m.key]?.['month']||null;
      html+=`<tr><td><div class="metric-name">${m.name}</div>${m.calc?'<div class="metric-formula">(tự tính)</div>':''}</td>`;
      if(m.input){html+=`<td><input class="metric-input" type="number" step="any" placeholder="0" id="${plat}_${m.key}" oninput="onMetricInput('${plat}')"></td>`;}
      else{html+=`<td><div class="metric-auto" id="${plat}_${m.key}_auto">—</div></td>`;}
      html+=`<td class="hist-val">${planW?fmtNum(planW,m.unit):'<span class="no-plan">—</span>'}</td>`;
      html+=`<td class="pct-cell" id="${plat}_${m.key}_pct">—</td>`;
      prevWeeks.forEach(pw=>{
        const prefix=plat[0];
        const raw={doanh_so:pw[`${prefix}_doanh_so`],chi_phi:pw[`${prefix}_chi_phi`],luot_xem:pw[`${prefix}_luot_xem`],luot_click:pw[`${prefix}_luot_click`],don_hang:pw[`${prefix}_don_hang`],sp_ban:pw[`${prefix}_sp_ban`]};
        const calc=calcMetrics(raw);
        html+=`<td class="hist-val">${fmtNum(calc[m.key],m.unit)}</td>`;
      });
      html+=`<td class="hist-val">${planMo?fmtNum(planMo,m.unit):'<span class="no-plan">—</span>'}</td></tr>`;
    });
    html+=`</tbody></table></div>`;
  });
  container.innerHTML=html;
}

function onMetricInput(plat){
  const raw={};
  INPUT_KEYS.forEach(k=>{const el=document.getElementById(`${plat}_${k}`);raw[k]=el?parseFloat(el.value)||0:0;});
  const calc=calcMetrics(raw);
  STATE[plat]=calc;
  METRICS.filter(m=>m.calc).forEach(m=>{const el=document.getElementById(`${plat}_${m.key}_auto`);if(el)el.textContent=fmtNum(calc[m.key],m.unit);});
  const wn=`w${STATE.weekInfo.weekNum}`;
  const plan=plat==='shopee'?STATE.shopee_plan:STATE.tiktok_plan;
  METRICS.forEach(m=>{
    const pctEl=document.getElementById(`${plat}_${m.key}_pct`);
    if(!pctEl)return;
    const planV=plan?.[m.key]?.[wn]||null;
    if(!planV){pctEl.textContent='—';pctEl.className='pct-cell';return;}
    const pct=getPct(calc[m.key],planV);
    pctEl.textContent=pct+'%';
    pctEl.className=`pct-cell pct-${pctClass(pct)}`;
  });
}

function showPlanModal(){document.getElementById('plan-modal').classList.add('open');initPlanModal();}
function closePlanModal(){document.getElementById('plan-modal').classList.remove('open');}

function initPlanModal(){
  const{platform,weekInfo}=STATE;
  const platforms=platform==='both'?['shopee','tiktok']:[platform];
  const container=document.getElementById('plan-modal-content');
  let html=`<p style="font-size:.84rem;color:var(--muted);margin-bottom:20px">Set Plan cho <strong>${STATE.store}</strong> — Tháng ${weekInfo.month}/${weekInfo.year}</p>`;
  platforms.forEach(plat=>{
    const platName=plat==='shopee'?'🛍️ Shopee':'🎵 TikTok Shop';
    html+=`<div class="r-section-title" style="margin-top:20px">${platName}</div><div class="plan-metric-grid"><div class="pmg-head">Metric</div><div class="pmg-head">W1</div><div class="pmg-head">W2</div><div class="pmg-head">W3</div><div class="pmg-head">W4</div><div class="pmg-head">MTD</div><div class="pmg-head">Cả tháng</div>`;
    METRICS.filter(m=>m.input).forEach(m=>{
      html+=`<div class="pmg-label"><span>${m.name}</span><span class="pmg-sub">${m.unit}</span></div>`;
      ['w1','w2','w3','w4','mtd','month'].forEach(w=>{
        const existing=plat==='shopee'?STATE.shopee_plan?.[m.key]?.[w]:STATE.tiktok_plan?.[m.key]?.[w];
        html+=`<div class="pmg-input"><input class="pmg-inp" type="number" step="any" id="plan_${plat}_${m.key}_${w}" value="${existing||''}" placeholder="0"></div>`;
      });
    });
    html+=`</div>`;
  });
  container.innerHTML=html;
}

async function savePlan(){
  const{platform,weekInfo,store,user}=STATE;
  const platforms=platform==='both'?['shopee','tiktok']:[platform];
  const btn=document.getElementById('plan-save-btn');
  btn.disabled=true;btn.textContent='Đang lưu...';
  try{
    for(const plat of platforms){
      const planData={};
      METRICS.filter(m=>m.input).forEach(m=>{
        planData[m.key]={};
        ['w1','w2','w3','w4','mtd','month'].forEach(w=>{
          const el=document.getElementById(`plan_${plat}_${m.key}_${w}`);
          planData[m.key][w]=parseFloat(el?.value)||0;
        });
      });
      const payload={action:'savePlan',username:user.username,store,platform:plat,month:weekInfo.month,year:weekInfo.year};
      if(plat==='shopee')payload.shopee_plan=planData;
      else payload.tiktok_plan=planData;
      await fetch(REPORT_API,{method:'POST',body:JSON.stringify(payload)});
      if(plat==='shopee')STATE.shopee_plan=planData;
      else STATE.tiktok_plan=planData;
    }
    STATE.hasPlan=true;
    showToast('✅ Đã lưu Plan!');
    closePlanModal();initStep2();
  }catch(e){showToast('❌ Lỗi lưu Plan','error');}
  finally{btn.disabled=false;btn.textContent='Lưu Plan →';}
}

async function generateReport(){
  const{platform}=STATE;
  const platforms=platform==='both'?['shopee','tiktok']:[platform];
  const btn=document.getElementById('gen-btn');
  btn.classList.add('loading');btn.disabled=true;
  platforms.forEach(plat=>{
    const raw={};
    INPUT_KEYS.forEach(k=>{const el=document.getElementById(`${plat}_${k}`);raw[k]=parseFloat(el?.value)||0;});
    STATE[plat]=calcMetrics(raw);
  });
  try{
    const dataForAI=buildDataSummary();
    const aiComment=await callClaudeAPI(dataForAI);
    const mtd=buildMTD();
    renderMailPreview(aiComment,mtd);
    renderStep(3);
  }catch(e){showToast('❌ Lỗi generate: '+e.message,'error');}
  finally{btn.classList.remove('loading');btn.disabled=false;}
}

function buildDataSummary(){
  const{platform,weekInfo,shopee_plan,tiktok_plan}=STATE;
  const platforms=platform==='both'?['shopee','tiktok']:[platform];
  const wn=`w${weekInfo.weekNum}`;
  let lines=[`Store: ${STATE.store} | ${weekInfo.label} | Platform: ${platform}`];
  platforms.forEach(plat=>{
    const data=STATE[plat];
    const plan=plat==='shopee'?shopee_plan:tiktok_plan;
    const name=plat==='shopee'?'Shopee':'TikTok Shop';
    lines.push(`\n== ${name} ==`);
    METRICS.forEach(m=>{
      const actual=data[m.key];
      const planV=plan?.[m.key]?.[wn]||null;
      const pct=planV?getPct(actual,planV)+'%':'N/A';
      lines.push(`${m.name}: Actual=${fmtNum(actual,m.unit)} | Plan=${planV?fmtNum(planV,m.unit):'N/A'} | vs Plan=${pct}`);
    });
  });
  return lines.join('\n');
}

function buildMTD(){
  const{platform,weekInfo}=STATE;
  const platforms=platform==='both'?['shopee','tiktok']:[platform];
  const mtd={};
  platforms.forEach(plat=>{
    mtd[plat]={};
    const hist=STATE.history[plat]||[];
    const prevWeeks=hist.filter(h=>h.week_num<weekInfo.weekNum);
    INPUT_KEYS.forEach(k=>{
      const prefix=plat[0];
      let sum=prevWeeks.reduce((acc,pw)=>acc+(parseFloat(pw[`${prefix}_${k}`])||0),0);
      sum+=parseFloat(STATE[plat][k])||0;
      mtd[plat][k]=sum;
    });
    mtd[plat]=calcMetrics(mtd[plat]);
  });
  return mtd;
}

async function callClaudeAPI(dataSummary){
  const prompt=`Bạn là chuyên gia phân tích hiệu suất quảng cáo Ecommerce tại Việt Nam.\nPlatform: TikTok Shop Ads và Shopee Ads (chỉ Marketplace, không Website).\nHãy phân tích dữ liệu sau và viết nhận xét theo framework DARA bối cảnh marketplace.\n\nDỮ LIỆU:\n${dataSummary}\n\nViết nhận xét theo 3 phần, ngắn gọn, thực chiến, dùng số liệu cụ thể:\n\n1. THỰC TRẠNG: Tóm tắt hiệu suất tuần này (2-3 câu). Nêu các chỉ số đạt/chưa đạt plan.\n\n2. VẤN ĐỀ: Chỉ ra 1-2 vấn đề chính. Drill xuống root cause. Bối cảnh marketplace: chú ý CR, AOV, cạnh tranh sàn.\n\n3. GIẢI PHÁP & PLAN TUẦN TỚI: 3-4 action cụ thể. TikTok Shop: creative, bid, live boost. Shopee: search ads, keyword, flash deal.\n\nViết thuần tiếng Việt, ngắn gọn, không cần tiêu đề section, không dùng emoji.`;
  const resp=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]})
  });
  const json=await resp.json();
  const text=json.content?.[0]?.text||'';
  const sectionLines={thuc_trang:[],van_de:[],giai_phap:[]};
  let cur='thuc_trang';
  text.split('\n').filter(l=>l.trim()).forEach(l=>{
    if(/^1\.|THỰC TRẠNG/i.test(l)){cur='thuc_trang';return;}
    if(/^2\.|VẤN ĐỀ/i.test(l)){cur='van_de';return;}
    if(/^3\.|GIẢI PHÁP/i.test(l)){cur='giai_phap';return;}
    sectionLines[cur].push(l);
  });
  return{
    thuc_trang:sectionLines.thuc_trang.join('\n').trim()||text.substring(0,300),
    van_de:sectionLines.van_de.join('\n').trim(),
    giai_phap:sectionLines.giai_phap.join('\n').trim()
  };
}

function renderMailPreview(aiComment,mtd){
  const{platform,weekInfo,store,user,shopee_plan,tiktok_plan}=STATE;
  const platforms=platform==='both'?['shopee','tiktok']:[platform];
  const wn=`w${weekInfo.weekNum}`;
  const subject=`MEDIA x Group | Báo cáo tuần & Kế hoạch hành động | ${store} | ${weekInfo.label}`;
  document.getElementById('mail-subject').textContent=subject;
  let html=`<div style="font-family:'Times New Roman',Times,serif;font-size:13px;color:#000;line-height:1.6">`;
  html+=`<p><strong>BÁO CÁO HIỆU SUẤT QUẢNG CÁO — ${store.toUpperCase()}</strong><br>${weekInfo.label} | ${weekInfo.start} – ${weekInfo.end}${!weekInfo.isFull?` (${weekInfo.days} ngày)`:''}</p><hr style="border:1px solid #ccc;margin:12px 0">`;
  const tablesToRender=platform==='both'?[{key:'total',name:'TỔNG 2 SÀN'},{key:'shopee',name:'SHOPEE ADS'},{key:'tiktok',name:'TIKTOK SHOP ADS'}]:[{key:platform,name:platform==='shopee'?'SHOPEE ADS':'TIKTOK SHOP ADS'}];
  tablesToRender.forEach(({key,name})=>{
    const isTotal=key==='total';
    const plats=isTotal?platforms:[key];
    const data={};
    if(isTotal){INPUT_KEYS.forEach(k=>{data[k]=plats.reduce((acc,p)=>acc+(parseFloat(STATE[p][k])||0),0);});Object.assign(data,calcMetrics(data));}
    else{Object.assign(data,STATE[key]);}
    const plan=isTotal?null:(key==='shopee'?shopee_plan:tiktok_plan);
    const mtdData=isTotal?(()=>{const t={};INPUT_KEYS.forEach(k=>{t[k]=plats.reduce((a,p)=>a+(parseFloat(mtd[p]?.[k])||0),0);});return calcMetrics(t);})():mtd[key];
    html+=`<p><strong>— ${name} —</strong></p><table style="border-collapse:collapse;width:100%;font-family:'Times New Roman',serif;font-size:12px;margin:6px 0 16px"><tr style="background:#1a2e5c;color:#fff"><th style="padding:6px 10px;border:1px solid #999;text-align:left">Metric</th><th style="padding:6px 10px;border:1px solid #999">Actual W</th><th style="padding:6px 10px;border:1px solid #999">Plan W</th><th style="padding:6px 10px;border:1px solid #999">% Plan</th><th style="padding:6px 10px;border:1px solid #999">MTD Actual</th><th style="padding:6px 10px;border:1px solid #999">MTD Plan</th><th style="padding:6px 10px;border:1px solid #999">% MTD</th>`;
    const histWeeks=(STATE.history[isTotal?platforms[0]:key]||[]).filter(h=>h.week_num<weekInfo.weekNum).sort((a,b)=>a.week_num-b.week_num);
    histWeeks.forEach(hw=>{html+=`<th style="padding:6px 10px;border:1px solid #999">W${hw.week_num}</th>`;});
    html+=`<th style="padding:6px 10px;border:1px solid #999">Plan T</th></tr>`;
    METRICS.forEach(m=>{
      const actual=data[m.key],planW=plan?.[m.key]?.[wn]||null,mtdAct=mtdData?.[m.key]||null,planMtd=plan?.[m.key]?.['mtd']||null,planMo=plan?.[m.key]?.['month']||null;
      const pctW=getPct(actual,planW),pctMTD=getPct(mtdAct,planMtd);
      const cW=pctW?`color:${parseFloat(pctW)>=90?'#059669':parseFloat(pctW)>=70?'#D97706':'#DC2626'};font-weight:bold`:'';
      const cM=pctMTD?`color:${parseFloat(pctMTD)>=90?'#059669':parseFloat(pctMTD)>=70?'#D97706':'#DC2626'};font-weight:bold`:'';
      html+=`<tr><td style="padding:5px 10px;border:1px solid #ccc;text-align:left">${m.name}</td><td style="padding:5px 10px;border:1px solid #ccc;text-align:right">${fmtNum(actual,m.unit)}</td><td style="padding:5px 10px;border:1px solid #ccc;text-align:right">${planW?fmtNum(planW,m.unit):'—'}</td><td style="padding:5px 10px;border:1px solid #ccc;text-align:right;${cW}">${pctW?pctW+'%':'—'}</td><td style="padding:5px 10px;border:1px solid #ccc;text-align:right">${mtdAct?fmtNum(mtdAct,m.unit):'—'}</td><td style="padding:5px 10px;border:1px solid #ccc;text-align:right">${planMtd?fmtNum(planMtd,m.unit):'—'}</td><td style="padding:5px 10px;border:1px solid #ccc;text-align:right;${cM}">${pctMTD?pctMTD+'%':'—'}</td>`;
      histWeeks.forEach(hw=>{
        const prefix=(isTotal?platforms[0]:key)[0];
        const raw={doanh_so:hw[`${prefix}_doanh_so`],chi_phi:hw[`${prefix}_chi_phi`],luot_xem:hw[`${prefix}_luot_xem`],luot_click:hw[`${prefix}_luot_click`],don_hang:hw[`${prefix}_don_hang`],sp_ban:hw[`${prefix}_sp_ban`]};
        const c=calcMetrics(raw);
        html+=`<td style="padding:5px 10px;border:1px solid #ccc;text-align:right">${fmtNum(c[m.key],m.unit)}</td>`;
      });
      html+=`<td style="padding:5px 10px;border:1px solid #ccc;text-align:right">${planMo?fmtNum(planMo,m.unit):'—'}</td></tr>`;
    });
    html+=`</table>`;
  });
  html+=`<hr style="border:1px solid #ccc;margin:12px 0"><p><strong>HIGHLIGHT &amp; LOWLIGHT</strong></p><table style="border-collapse:collapse;width:100%;font-family:'Times New Roman',serif;font-size:12px"><tr><th style="background:#1a5c2e;color:#fff;padding:6px 14px;border:1px solid #999;text-align:left;width:50%">✅ Highlight</th><th style="background:#5c1a1a;color:#fff;padding:6px 14px;border:1px solid #999;text-align:left;width:50%">⚠️ Lowlight</th></tr><tr><td style="padding:10px 14px;border:1px solid #ccc;vertical-align:top">1. <br>2. </td><td style="padding:10px 14px;border:1px solid #ccc;vertical-align:top">1. <br>2. </td></tr></table>`;
  html+=`<hr style="border:1px solid #ccc;margin:12px 0"><p><strong>NHẬN XÉT &amp; KẾ HOẠCH</strong></p><p><strong>Thực trạng:</strong><br>${(aiComment.thuc_trang||'').replace(/\n/g,'<br>')}</p><p><strong>Vấn đề:</strong><br>${(aiComment.van_de||'').replace(/\n/g,'<br>')}</p><p><strong>Giải pháp &amp; Plan tuần tới:</strong><br>${(aiComment.giai_phap||'').replace(/\n/g,'<br>')}</p>`;
  html+=`<hr style="border:1px solid #ccc;margin:12px 0"><p style="color:#555;font-size:12px">Reported by: ${user.name} | ${fmtDate(new Date())}</p></div>`;
  document.getElementById('mail-body').innerHTML=html;
  STATE._aiComment=aiComment;
}

function copyMail(){
  const subject=document.getElementById('mail-subject').textContent;
  const body=document.getElementById('mail-body');
  const blob=new Blob([`<b>Subject: ${subject}</b><br><br>`+body.innerHTML],{type:'text/html'});
  const clipItem=new ClipboardItem({'text/html':blob});
  navigator.clipboard.write([clipItem]).then(()=>{
    const btn=document.getElementById('copy-btn');
    btn.textContent='✓ Đã copy!';btn.classList.add('copied');
    showToast('✅ Đã copy — paste vào Lark Mail!');
    setTimeout(()=>{btn.textContent='Copy → Lark';btn.classList.remove('copied');},3000);
  }).catch(()=>{
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body.innerText}`);
    showToast('Đã copy (text only)','success');
  });
}

async function saveReport(){
  const{platform,weekInfo,store,user}=STATE;
  const platforms=platform==='both'?['shopee','tiktok']:[platform];
  const btn=document.getElementById('save-btn');
  btn.disabled=true;btn.textContent='Đang lưu...';
  const ai=STATE._aiComment||{};
  try{
    for(const plat of platforms){
      const data=STATE[plat];
      const payload={action:'saveWeekly',username:user.username,store,platform:plat,week_label:weekInfo.label,week_start:weekInfo.start,week_end:weekInfo.end,month:weekInfo.month,year:weekInfo.year,week_num:weekInfo.weekNum,shopee:plat==='shopee'?{doanh_so:data.doanh_so,chi_phi:data.chi_phi,luot_xem:data.luot_xem,luot_click:data.luot_click,don_hang:data.don_hang,sp_ban:data.sp_ban}:{},tiktok:plat==='tiktok'?{doanh_so:data.doanh_so,chi_phi:data.chi_phi,luot_xem:data.luot_xem,luot_click:data.luot_click,don_hang:data.don_hang,sp_ban:data.sp_ban}:{},highlight:'',lowlight:'',nhan_xet_thuc_trang:ai.thuc_trang||'',nhan_xet_van_de:ai.van_de||'',nhan_xet_giai_phap:ai.giai_phap||''};
      await fetch(REPORT_API,{method:'POST',body:JSON.stringify(payload)});
    }
    showToast('✅ Đã lưu báo cáo vào Google Sheets!');
  }catch(e){showToast('❌ Lỗi lưu','error');}
  finally{btn.disabled=false;btn.textContent='Lưu vào Sheets';}
}

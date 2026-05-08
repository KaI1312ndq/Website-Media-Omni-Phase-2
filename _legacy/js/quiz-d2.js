/* ═══════════════════════════════════════
   MEDIA OMNI — QUIZ D2 JS
   Chỉ số Ads — 30 câu
═══════════════════════════════════════ */

const CHISO=[
  {q:'Chi phí (Ad Spend) là gì?',opts:['Tổng doanh thu từ chiến dịch','Tổng tiền đã chi để chạy quảng cáo','Tiền thu về sau khi trừ chi phí','Ngân sách tối đa được phê duyệt'],ans:1,explain:'Ad Spend = tổng tiền thực tế chi để hiển thị quảng cáo. Đầu vào cơ bản để tính ROAS, CPC, CPM.',tags:['Chi phí']},
  {q:'GMV (Gross Merchandise Value) là gì?',opts:['Doanh thu sau khi trừ hoa hồng','Tổng giá trị đơn hàng đặt thành công kể cả đơn hủy và hoàn','Doanh thu thuần','Số đơn × giá bán'],ans:1,explain:'GMV = tổng giá trị đơn hàng tạo ra, kể cả hủy và hoàn. NMV = GMV trừ hủy/hoàn = doanh thu thực.',tags:['GMV']},
  {q:'ROAS được tính theo công thức nào?',opts:['ROAS = GMV × Chi phí','ROAS = Chi phí ÷ GMV','ROAS = GMV ÷ Chi phí','ROAS = (GMV - Chi phí) ÷ Chi phí'],ans:2,explain:'ROAS = GMV ÷ Chi phí. VD: chi 10M, thu 70M → ROAS = 7. Benchmark Media Omni: TikTok ~6, Shopee ~9.',tags:['ROAS']},
  {q:'ROAS = 5 có nghĩa là gì?',opts:['5đ chi phí tạo 1đ GMV','1đ chi phí tạo 5đ GMV','Tỷ lệ chuyển đổi 5%','Doanh thu tăng 5%'],ans:1,explain:'ROAS = 5 → mỗi 1đ bỏ ra thu 5đ GMV. Chưa phải lợi nhuận vì chưa trừ giá vốn.',tags:['ROAS']},
  {q:'Impression (Lượt hiển thị) là gì?',opts:['Số người thực sự nhìn thấy QC','Số lần QC hiển thị kể cả cùng 1 người thấy nhiều lần','Số lần click vào QC','Số lần phân phối không nhất thiết được xem'],ans:1,explain:'Impression = số lần xuất hiện. Một người có thể tạo nhiều impression. Khác Reach là số người unique.',tags:['Impression']},
  {q:'Điểm khác biệt giữa Reach và Impression?',opts:['Reach tính click, Impression tính view','Reach là số người unique thấy QC, Impression là tổng lần hiển thị','Reach đo mobile, Impression đo tất cả','Reach là paid, Impression là organic'],ans:1,explain:'Reach = người unique. Impression = tổng lần hiển thị. Impression ÷ Reach = Frequency.',tags:['Reach','Impression']},
  {q:'Frequency được tính bằng công thức nào?',opts:['Frequency = Reach ÷ Impression','Frequency = Impression ÷ Reach','Frequency = Click ÷ Impression','Frequency = Impression ÷ Click'],ans:1,explain:'Frequency = Impression ÷ Reach. VD: 100K impression / 50K reach = Freq 2.',tags:['Frequency']},
  {q:'Frequency cao ảnh hưởng đến quảng cáo như thế nào?',opts:['Luôn tốt vì tăng nhận diện','Gây ad fatigue — CTR giảm, CPC tăng','Không ảnh hưởng đáng kể','Chỉ ảnh hưởng remarketing'],ans:1,explain:'Frequency cao (>3-5 trên Meta) gây ad fatigue: CTR giảm, CPC tăng.',tags:['Frequency']},
  {q:'CPC được tính theo công thức nào?',opts:['CPC = Click ÷ Chi phí','CPC = Chi phí ÷ Click','CPC = Impression ÷ Click','CPC = Chi phí × Click'],ans:1,explain:'CPC = Chi phí ÷ Số click. VD: 1M / 500 click = 2.000đ/click.',tags:['CPC']},
  {q:'Yếu tố nào KHÔNG ảnh hưởng đến CPC?',opts:['Chất lượng creative','Mức cạnh tranh auction','CVR sau click','CTR quảng cáo'],ans:2,explain:'CVR xảy ra sau click nên không ảnh hưởng ngược lại CPC. CPC phụ thuộc: CTR, quality score, bidding.',tags:['CPC']},
  {q:'CPM là chi phí cho bao nhiêu lượt hiển thị?',opts:['10 lượt','100 lượt','1.000 lượt','10.000 lượt'],ans:2,explain:'CPM = Cost Per Mille = chi phí 1.000 lần hiển thị. CPM = (Chi phí ÷ Impression) × 1.000.',tags:['CPM']},
  {q:'Yếu tố nào làm CPM tăng cao trên Meta Ads?',opts:['Audience rộng, ít cạnh tranh','Audience nhỏ, mùa cao điểm, creative score thấp','CTR quá cao','Budget quá nhỏ'],ans:1,explain:'CPM tăng: audience nhỏ (ít inventory), mùa cao điểm (nhiều advertiser), relevance thấp.',tags:['CPM']},
  {q:'CTR được tính theo công thức nào?',opts:['CTR = Click ÷ Reach × 100%','CTR = Click ÷ Impression × 100%','CTR = Impression ÷ Click × 100%','CTR = Conversion ÷ Click × 100%'],ans:1,explain:'CTR = Click ÷ Impression × 100%. VD: 500 click / 100K impression = 0.5%.',tags:['CTR']},
  {q:'CTR All và CTR Link Click khác nhau thế nào trên Meta?',opts:['CTR All chỉ tính link click','CTR All tính mọi click, CTR Link Click chỉ tính click vào destination URL','Hai chỉ số giống nhau','CTR All cho video, Link Click cho static'],ans:1,explain:'CTR All = mọi loại click. CTR Link Click = click vào landing page. Dùng Link Click để đo intent thực.',tags:['CTR','Meta']},
  {q:'Add to Cart Rate được tính như thế nào?',opts:['Số thêm giỏ ÷ Đơn hàng × 100%','Số thêm giỏ ÷ Lượt xem trang SP × 100%','Số thêm giỏ ÷ Click × 100%','Số thêm giỏ ÷ Impression × 100%'],ans:1,explain:'Add to Cart Rate = Số thêm giỏ ÷ Product Page View × 100%. Phản ánh sức hút của SP.',tags:['Giỏ hàng']},
  {q:'Add to Cart cao nhưng Checkout thấp thường do đâu?',opts:['Creative không hấp dẫn','Giá không cạnh tranh, phí ship cao, UX checkout phức tạp','Audience targeting sai','Budget không đủ'],ans:1,explain:'Bottleneck giỏ hàng→checkout: shipping fee cao, thiếu payment method, UX phức tạp.',tags:['Funnel']},
  {q:'Purchase Rate trong TikTok Shop được tính thế nào?',opts:['Đơn ÷ Impression × 100%','Đơn ÷ Click × 100%','Đơn ÷ Lượt xem trang SP × 100%','Đơn ÷ Thêm giỏ × 100%'],ans:2,explain:'Purchase Rate = Đơn ÷ Product Page View × 100%. Phản ánh hiệu quả toàn funnel.',tags:['TikTok']},
  {q:'CIR được tính bằng công thức nào?',opts:['CIR = GMV ÷ Chi phí × 100%','CIR = Chi phí ÷ GMV × 100%','CIR = (CP + Giá vốn) ÷ GMV × 100%','CIR = CP ÷ Lợi nhuận × 100%'],ans:1,explain:'CIR = Chi phí ÷ GMV × 100%. Nghịch đảo ROAS: ROAS = 7 → CIR ≈ 14.3%.',tags:['CIR']},
  {q:'ROI khác ROAS ở điểm quan trọng nào?',opts:['Là hai tên của cùng chỉ số','ROI tính trên lợi nhuận thực sau trừ giá vốn, ROAS tính trên GMV','ROAS tính lợi nhuận, ROI tính doanh thu','ROI chỉ dùng cho ecommerce'],ans:1,explain:'ROAS = GMV/Chi phí. ROI = (Lợi nhuận - CP)/CP × 100%. ROAS cao vẫn có thể ROI âm nếu margin thấp.',tags:['ROI','ROAS']},
  {q:'AOV được tính như thế nào?',opts:['AOV = Đơn ÷ GMV','AOV = GMV ÷ Đơn','AOV = GMV ÷ Số SP','AOV = Chi phí ÷ Đơn'],ans:1,explain:'AOV = GMV ÷ Số đơn. AOV cao = hiệu quả tốt hơn khi chi phí/đơn không đổi.',tags:['AOV']},
  {q:'Yếu tố giúp tăng AOV hiệu quả nhất?',opts:['Giảm giá SP','Bundle, upsell, cross-sell và ngưỡng freeship','Tăng tần suất QC','Mở rộng audience'],ans:1,explain:'AOV tăng bằng: Bundle, Upsell, Cross-sell, Minimum order freeship.',tags:['AOV']},
  {q:'Repeat Purchase Rate (RPR) phản ánh điều gì?',opts:['Tỷ lệ click QC lần 2','Tỷ lệ khách đã mua quay lại mua thêm','Số lần xem QC trung bình','Tỷ lệ quay lại trang sau bounce'],ans:1,explain:'RPR = Khách mua lại ÷ Tổng khách đã mua × 100%. RPR cao giảm chi phí acquisition.',tags:['Retention']},
  {q:'Yếu tố ảnh hưởng nhiều nhất đến RPR?',opts:['Tần suất retargeting','Chất lượng SP, trải nghiệm mua và CS sau bán','CTR QC brand','Ngân sách campaign'],ans:1,explain:'RPR phụ thuộc chủ yếu vào trải nghiệm sau mua: chất lượng SP, giao hàng nhanh, CS hậu mãi.',tags:['Retention']},
  {q:'ROAS tốt nhưng CIR cũng cao là dấu hiệu gì?',opts:['Campaign over-spend','Biên lợi nhuận thấp, cần review pricing','Audience bão hòa','Creative hết hiệu quả'],ans:1,explain:'CIR cao = chi phí ads chiếm tỷ trọng lớn trong GMV. ROAS = 7 nhưng margin 15% thì gần hết lãi.',tags:['Business']},
  {q:'Drop-off lớn nhất trong funnel TikTok Shop thường ở đâu?',opts:['Impression → Click','Product View → Add to Cart','Add to Cart → Checkout','Checkout → Purchase'],ans:1,explain:'Drop-off lớn nhất ở Product View → Add to Cart. Tối ưu: ảnh/video SP tốt, review, giá cạnh tranh.',tags:['Funnel']},
  {q:'CPM tăng 30%, CTR tăng 30%, CPC thay đổi thế nào?',opts:['CPC tăng 30%','CPC giảm 30%','CPC không thay đổi','CPC tăng 60%'],ans:2,explain:'CPC = CPM/(CTR×10). CPM×1.3 ÷ CTR×1.3 = không đổi. Tăng cùng tỷ lệ → CPC giữ nguyên.',tags:['Tính toán']},
  {q:'Shopee GMV trực tiếp và gián tiếp khác nhau thế nào?',opts:['Direct = click rồi mua ngay; Indirect = xem, rời, quay lại mua trong attribution window','Direct = desktop; Indirect = mobile','Direct = mua SP được QC; Indirect = mua SP khác','Direct = paid; Indirect = organic'],ans:0,explain:'Direct GMV = đơn trong session click ads. Indirect = click ads, không mua ngay, quay lại trong window 7-14 ngày.',tags:['Shopee']},
  {q:'Benchmark ROAS phù hợp cho Shopee Ads theo Media Omni?',opts:['3-4','5-6','8-10','12+'],ans:2,explain:'Benchmark Shopee Media Omni: ROAS ~9. Range 8-10 là tốt. Cao hơn TikTok vì intent mua cao hơn.',tags:['Shopee','ROAS']},
  {q:'Tại sao ROAS Shopee (~9) cao hơn TikTok (~6)?',opts:['Shopee nhiều user hơn','Shopee = marketplace với intent mua cao; TikTok = social cần tạo demand trước','TikTok ads đắt hơn','Shopee tính ROAS khác'],ans:1,explain:'TikTok = demand creation: phải tạo nhu cầu → CR thấp. Shopee = intent capture: user đã muốn mua → CR cao.',tags:['Strategy']},
  {q:'CPA được tính như thế nào?',opts:['CPA = Click ÷ Conversion','CPA = Chi phí ÷ Conversion','CPA = Conversion ÷ Chi phí','CPA = Chi phí ÷ Impression × 1000'],ans:1,explain:'CPA = Chi phí ÷ Số conversion. Conversion có thể là đơn hàng, lead, install. CPA thấp = hiệu quả tốt.',tags:['CPA']},
];

let d2Q=0,d2Ans=[],d2Mk=[],d2Score=0,d2Tiv=null,d2TL=900,d2Start=null;

function startD2(){
  d2Q=0;d2Ans=new Array(CHISO.length).fill(null);d2Mk=new Array(CHISO.length).fill(false);
  d2Score=0;d2TL=900;d2Start=Date.now();
  // show d2 page
  document.getElementById('hub-page').classList.remove('active');
  document.getElementById('d2-page').style.display='block';
  document.getElementById('d2-tot').textContent=CHISO.length;
  buildNavGrid();renderQ();startD2Timer();
  window.scrollTo({top:0,behavior:'smooth'});
}

function buildNavGrid(){
  document.getElementById('q-nav-grid').innerHTML=CHISO.map((_,i)=>`<button class="qnb${i===0?' cur':''}" id="qnb-${i}" onclick="jmpQ(${i})">${i+1}</button>`).join('');
}

function renderQ(){
  const q=CHISO[d2Q];const tot=CHISO.length;
  document.getElementById('d2-cur').textContent=d2Q+1;
  document.getElementById('q2-pfill').style.width=`${d2Q/tot*100}%`;
  document.getElementById('d2-q-header').textContent=`Câu hỏi ${d2Q+1}`;
  document.getElementById('d2-q-text').textContent=q.q;
  const ua=d2Ans[d2Q];const ans=ua!==null;
  document.getElementById('d2-opts').innerHTML=q.opts.map((opt,i)=>{
    let cls='d2-opt';
    if(ans){cls+=' disabled';if(i===q.ans)cls+=' correct';else if(i===ua&&i!==q.ans)cls+=' wrong';}
    else if(i===ua)cls+=' selected';
    return `<button class="${cls}" onclick="selA(${i})"><div class="olet">${['A','B','C','D'][i]}</div><div class="otxt">${opt}</div></button>`;
  }).join('');
  const exp=document.getElementById('d2-explain');
  if(ans&&q.explain){document.getElementById('d2-exp-text').textContent=q.explain;exp.style.display='block';}
  else exp.style.display='none';
  document.getElementById('tag-chips').innerHTML=(q.tags||[]).map(t=>`<span class="tag-chip">${t}</span>`).join('');
  document.getElementById('btn-mark').textContent=d2Mk[d2Q]?'Đã đánh dấu':'Đánh dấu';
  document.getElementById('btn-next-q').textContent=d2Q===tot-1?'Nộp bài →':'Câu tiếp →';
  // nav dots
  CHISO.forEach((_,i)=>{
    const b=document.getElementById(`qnb-${i}`);if(!b)return;
    b.className='qnb';
    if(i===d2Q)b.classList.add('cur');
    else if(d2Mk[i])b.classList.add('mk');
    else if(d2Ans[i]!==null)b.classList.add(d2Ans[i]===CHISO[i].ans?'ok':'ng');
  });
  updRing();
}

function selA(idx){if(d2Ans[d2Q]!==null)return;d2Ans[d2Q]=idx;if(idx===CHISO[d2Q].ans)d2Score++;renderQ();}
function nextQ(){if(d2Q===CHISO.length-1){submitD2();return;}d2Q++;renderQ();}
function prevQ(){if(d2Q>0){d2Q--;renderQ();}}
function jmpQ(i){d2Q=i;renderQ();}
function markQ(){d2Mk[d2Q]=!d2Mk[d2Q];renderQ();}

function updRing(){
  const tot=CHISO.length;
  const ok=d2Ans.reduce((a,v,i)=>v!==null&&v===CHISO[i].ans?a+1:a,0);
  const done=d2Ans.filter(v=>v!==null).length;
  const pct=done>0?Math.round(ok/done*100):0;
  document.getElementById('ring-c').style.strokeDashoffset=220-(220*pct/100);
  document.getElementById('ring-pct').textContent=pct+'%';
  document.getElementById('s-ok').textContent=ok;
  document.getElementById('s-left').textContent=tot-done;
}

function startD2Timer(){
  clearInterval(d2Tiv);
  d2Tiv=setInterval(()=>{
    d2TL--;const m=Math.floor(d2TL/60);const s=d2TL%60;
    const el=document.getElementById('q2-timer');
    el.textContent=`${m}:${s.toString().padStart(2,'0')}`;
    el.className='q2-timer'+(d2TL<=60?' warn':'');
    if(d2TL<=0){clearInterval(d2Tiv);submitD2();}
  },1000);
}

function submitD2(){
  clearInterval(d2Tiv);
  const tot=CHISO.length;
  const ok=d2Ans.reduce((a,v,i)=>v!==null&&v===CHISO[i].ans?a+1:a,0);
  const pct=Math.round(ok/tot*100);
  const dur=Math.round((Date.now()-d2Start)/60000);
  document.getElementById('d2-page').style.display='none';
  document.getElementById('res-page').style.display='block';
  document.getElementById('res-score').textContent=`${ok}/${tot}`;
  document.getElementById('res-topic').textContent='Chỉ số Ads';
  let em='😐',gd='Cần cải thiện — ôn lại tài liệu!';
  if(pct>=90){em='🏆';gd='Xuất sắc! Nắm vững toàn bộ chỉ số.';}
  else if(pct>=70){em='✅';gd='Tốt! Còn vài điểm cần ôn thêm.';}
  else if(pct>=50){em='📚';gd='Trung bình — đọc lại SOP và thử lại.';}
  document.getElementById('res-em').textContent=em;
  document.getElementById('res-grade').textContent=gd;
  document.getElementById('res-bd').innerHTML=CHISO.map((q,i)=>{
    const c=d2Ans[i]===q.ans;
    return `<div class="rbd-item"><span class="rbd-n">${i+1}</span><span class="rbd-q">${q.q.substring(0,60)}${q.q.length>60?'...':''}</span><span class="rbd-p ${c?'rbd-ok':'rbd-ng'}">${c?'✓ Đúng':'✗ Sai'}</span></div>`;
  }).join('');
  window.scrollTo({top:0,behavior:'smooth'});
  // Save
  const u=Auth.get();if(!u)return;
  fetch(GS_QUIZ_URL,{method:'POST',body:JSON.stringify({type:'quiz',quizType:'Dạng 2 - Chỉ số Ads',topic:'Chỉ số Ads',score:ok,total:tot,pct,duration:dur,username:u.username,name:u.name,role:u.role})}).catch(()=>{});
}

function retryD2(){
  document.getElementById('res-page').style.display='none';
  startD2();
}

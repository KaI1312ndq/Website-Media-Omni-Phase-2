/* ═══════════════════════════════════════════════════════════
   MEDIA OMNI — Weekly Report Tool Apps Script V8
   Sheets: BrandList | WeeklyData | PlanData
   Deploy: Web App → Execute as Me → Access Anyone (unauthenticated)
   Script Properties → CLAUDE_API_KEY = sk-ant-...
═══════════════════════════════════════════════════════════ */

const WEEKLY_COLS = [
  'id','username','brand_name','month','year','week_num','week_start','week_end',
  's_cpc_doanh_so','s_cpc_chi_phi','s_cpc_luot_xem','s_cpc_luot_click','s_cpc_don_hang',
  's_nd_gmv','s_nd_chi_phi','s_nd_luot_xem','s_nd_luot_click',
  's_live_gmv','s_live_chi_phi','s_live_luot_xem',
  't_pgm_doanh_so','t_pgm_chi_phi','t_pgm_luot_xem','t_pgm_luot_click','t_pgm_don_hang',
  't_lgm_doanhthu','t_lgm_chi_phi',
  't_con_nguoi','t_con_chi_phi',
  't_brd_view','t_brd_follow','t_brd_chi_phi',
  'highlight','lowlight',
  'nhan_xet_thuc_trang','nhan_xet_van_de','nhan_xet_giai_phap',
  'created_at'
];

const PLAN_METRIC_KEYS = [
  's_cpc_doanh_so','s_cpc_chi_phi',
  's_nd_gmv','s_nd_chi_phi',
  's_live_gmv','s_live_chi_phi',
  't_pgm_doanh_so','t_pgm_chi_phi',
  't_lgm_doanhthu','t_lgm_chi_phi',
  't_con_chi_phi','t_brd_chi_phi'
];
const PLAN_WS = ['plan_month','plan_w1','plan_w2','plan_w3','plan_w4','plan_w5'];
const PLAN_COLS = ['id','username','brand_name','month','year',
  ...PLAN_METRIC_KEYS.flatMap(k => PLAN_WS.map(w => `${k}__${w}`)),
  'created_at','updated_at'
];
const BRAND_COLS = ['id','brand_name','assigned_members'];
const SEED_BRANDS = ['Meracine','Bye Bye Blemish','Yumvita','Brand D','Brand E'];

/* ── UTILS ── */
function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    const hdr = sh.getRange(1, 1, 1, headers.length);
    hdr.setFontWeight('bold').setBackground('#1a2e5c').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function sheetToJson(sh) {
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function seedBrands() {
  const sh = getSheet('BrandList', BRAND_COLS);
  if (sh.getLastRow() > 1) return;
  SEED_BRANDS.forEach((b, i) => sh.appendRow([i + 1, b, 'all']));
}

/* ── doGet ── */
function doGet(e) {
  try {
    seedBrands();
    const action = (e.parameter.action || '').trim();
    if (action === 'getBrands')       return getBrands(e.parameter);
    if (action === 'getPlan')         return getPlan(e.parameter);
    if (action === 'getWeeklyHistory')return getWeeklyHistory(e.parameter);
    if (action === 'checkPlan')       return checkPlan(e.parameter);
    return jsonOut({ ok: false, error: 'Unknown action: ' + action });
  } catch(err) { return jsonOut({ ok: false, error: err.message }); }
}

/* ── doPost ── */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    if (action === 'saveWeekly') return saveWeekly(body);
    if (action === 'savePlan')   return savePlan(body);
    if (action === 'callClaude') return callClaudeProxy(body);
    return jsonOut({ ok: false, error: 'Unknown action: ' + action });
  } catch(err) { return jsonOut({ ok: false, error: err.message }); }
}

/* ── getBrands ── */
function getBrands(params) {
  const sh = getSheet('BrandList', BRAND_COLS);
  const rows = sheetToJson(sh);
  const username = params.username || '';
  const brands = rows
    .filter(r => r.brand_name)
    .filter(r => {
      const m = (r.assigned_members || '').toString().trim();
      return m === 'all' || !username || m.split(',').map(s => s.trim()).includes(username);
    })
    .map(r => r.brand_name.toString());
  return jsonOut({ ok: true, data: brands });
}

/* ── getPlan ── */
function getPlan(params) {
  const sh = getSheet('PlanData', PLAN_COLS);
  const rows = sheetToJson(sh);
  const brand = params.brand_name || '';
  const month = parseInt(params.month);
  const year  = parseInt(params.year);
  const row = rows.find(r =>
    r.brand_name === brand &&
    parseInt(r.month) === month &&
    parseInt(r.year)  === year
  );
  if (!row) return jsonOut({ ok: true, data: null });
  const plan = {};
  PLAN_METRIC_KEYS.forEach(k => {
    plan[k] = {};
    PLAN_WS.forEach(w => { plan[k][w] = parseFloat(row[`${k}__${w}`]) || 0; });
  });
  return jsonOut({ ok: true, data: plan });
}

/* ── checkPlan ── */
function checkPlan(params) {
  const sh = getSheet('PlanData', PLAN_COLS);
  const rows = sheetToJson(sh);
  const brand = params.brand_name || '';
  const month = parseInt(params.month);
  const year  = parseInt(params.year);
  const exists = rows.some(r =>
    r.brand_name === brand &&
    parseInt(r.month) === month &&
    parseInt(r.year)  === year
  );
  return jsonOut({ ok: true, data: { exists } });
}

/* ── getWeeklyHistory ── */
function getWeeklyHistory(params) {
  const sh = getSheet('WeeklyData', WEEKLY_COLS);
  const rows = sheetToJson(sh);
  const brand = params.brand_name || '';
  const month = parseInt(params.month);
  const year  = parseInt(params.year);
  const data = rows.filter(r =>
    r.brand_name === brand &&
    parseInt(r.month) === month &&
    parseInt(r.year)  === year
  );
  return jsonOut({ ok: true, data });
}

/* ── savePlan ── */
function savePlan(body) {
  const sh = getSheet('PlanData', PLAN_COLS);
  const allVals = sh.getDataRange().getValues();
  const headers = allVals[0];
  const dataRows = allVals.slice(1);
  const brand  = body.brand_name;
  const month  = parseInt(body.month);
  const year   = parseInt(body.year);
  const bi = headers.indexOf('brand_name');
  const mi = headers.indexOf('month');
  const yi = headers.indexOf('year');
  let existIdx = dataRows.findIndex(r =>
    r[bi] === brand && parseInt(r[mi]) === month && parseInt(r[yi]) === year
  );
  const now  = new Date().toISOString();
  const plan = body.plan || {};
  const rowMap = {
    brand_name: brand, username: body.username || '',
    month, year, updated_at: now
  };
  PLAN_METRIC_KEYS.forEach(k => {
    PLAN_WS.forEach(w => { rowMap[`${k}__${w}`] = plan[k]?.[w] || 0; });
  });
  if (existIdx >= 0) {
    rowMap['id']         = dataRows[existIdx][headers.indexOf('id')];
    rowMap['created_at'] = dataRows[existIdx][headers.indexOf('created_at')];
    const rowData = headers.map(h => rowMap[h] !== undefined ? rowMap[h] : dataRows[existIdx][headers.indexOf(h)]);
    sh.getRange(existIdx + 2, 1, 1, headers.length).setValues([rowData]);
  } else {
    rowMap['id']         = Utilities.getUuid();
    rowMap['created_at'] = now;
    sh.appendRow(headers.map(h => rowMap[h] !== undefined ? rowMap[h] : ''));
  }
  return jsonOut({ ok: true });
}

/* ── saveWeekly ── */
function saveWeekly(body) {
  const sh = getSheet('WeeklyData', WEEKLY_COLS);
  const allVals = sh.getDataRange().getValues();
  const headers = allVals[0];
  const dataRows = allVals.slice(1);
  const brand   = body.brand_name;
  const month   = parseInt(body.month);
  const year    = parseInt(body.year);
  const weekNum = parseInt(body.week_num);
  const bi = headers.indexOf('brand_name');
  const mi = headers.indexOf('month');
  const yi = headers.indexOf('year');
  const wi = headers.indexOf('week_num');
  let existIdx = dataRows.findIndex(r =>
    r[bi] === brand && parseInt(r[mi]) === month &&
    parseInt(r[yi]) === year && parseInt(r[wi]) === weekNum
  );
  const now = new Date().toISOString();
  const rowMap = {
    brand_name: brand, username: body.username || '',
    month, year, week_num: weekNum,
    week_start: body.week_start || '', week_end: body.week_end || '',
    highlight: body.highlight || '', lowlight: body.lowlight || '',
    nhan_xet_thuc_trang: body.nhan_xet_thuc_trang || '',
    nhan_xet_van_de:     body.nhan_xet_van_de || '',
    nhan_xet_giai_phap:  body.nhan_xet_giai_phap || ''
  };
  WEEKLY_COLS.forEach(col => {
    if (col.startsWith('s_') || col.startsWith('t_'))
      rowMap[col] = parseFloat(body[col]) || 0;
  });
  if (existIdx >= 0) {
    rowMap['id']         = dataRows[existIdx][headers.indexOf('id')];
    rowMap['created_at'] = dataRows[existIdx][headers.indexOf('created_at')];
    sh.getRange(existIdx + 2, 1, 1, headers.length)
      .setValues([headers.map(h => rowMap[h] !== undefined ? rowMap[h] : '')]);
  } else {
    rowMap['id']         = Utilities.getUuid();
    rowMap['created_at'] = now;
    sh.appendRow(headers.map(h => rowMap[h] !== undefined ? rowMap[h] : ''));
  }
  return jsonOut({ ok: true });
}

/* ── callClaudeProxy ── */
function callClaudeProxy(body) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!apiKey) return jsonOut({ ok: false, error: 'CLAUDE_API_KEY chưa được set trong Script Properties' });
  try {
    const resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: body.system || '',
        messages: [{ role: 'user', content: body.user || '' }]
      }),
      muteHttpExceptions: true
    });
    const json = JSON.parse(resp.getContentText());
    if (json.error) return jsonOut({ ok: false, error: json.error.message });
    return jsonOut({ ok: true, data: json.content?.[0]?.text || '' });
  } catch(err) { return jsonOut({ ok: false, error: err.message }); }
}

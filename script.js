/* 生活应急保险库 v2.8.1 - 核心逻辑 */

let state = {
  mode: 'adult', startAge: 30, currentAge: 30, sumWhole: 1000000,
  totalClaimed: 0, isFirstClaimed: false, currency: 'USD', exchangeRate: 7.2
};

// --- 初始化與 PWA 檢查 ---
window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  if(params.get('shared') === '1') {
    document.body.classList.add('shared-mode');
    const name = decodeURIComponent(params.get('n') || '貴賓');
    document.getElementById('vipBanner').innerHTML = `🌟 尊貴的 ${name}，這是為您定制的防御矩陣`;
    document.getElementById('vipBanner').style.display = 'block';
    
    // 加載分享數據
    document.getElementById('startAge').value = params.get('a') || 30;
    document.getElementById('sumWhole').value = Number(params.get('s') || 1000000).toLocaleString();
    state.mode = params.get('m') || 'adult';
    state.currency = params.get('c') || 'USD';
    setMode(state.mode);
    initDashboard();
  } else {
    updateClientDropdown();
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
};

function forceUpdateApp() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.update());
      alert("🚀 更新已發送！請關閉 App 並重新開啟以完成 v2.8 升級。");
      location.reload(true);
    });
  }
}

// --- 理賠推演邏輯 ---
function setMode(m) {
  state.mode = m;
  document.getElementById('btnAdultMode').classList.toggle('active', m === 'adult');
  document.getElementById('btnChildMode').classList.toggle('active', m === 'child');
  document.getElementById('adultControls').style.display = m === 'adult' ? 'block' : 'none';
  document.getElementById('childControls').style.display = m === 'child' ? 'block' : 'none';
}

function initDashboard() {
  state.startAge = parseInt(document.getElementById('startAge').value);
  state.currentAge = state.startAge;
  let rawSum = document.getElementById('sumWhole').value.replace(/,/g, '');
  state.sumWhole = parseFloat(rawSum);
  state.totalClaimed = 0;
  state.isFirstClaimed = false;
  document.getElementById('logList').innerHTML = "";
  updateUI();
  addLog("🛡️ 保單生效", formatCurrency(state.sumWhole));
}

function triggerFirstClaim() {
  if(state.isFirstClaimed) return;
  state.isFirstClaimed = true;
  state.totalClaimed += state.sumWhole;
  state.currentAge += 2;
  addLog("🚨 首次重疾理賠", formatCurrency(state.sumWhole));
  updateUI();
}

function triggerEarlyStage() {
  let amt = state.sumWhole * 0.2;
  state.totalClaimed += amt;
  state.currentAge += 1;
  addLog("🩺 輕疾理賠", formatCurrency(amt));
  updateUI();
}

function triggerCancerLump() {
  if(!state.isFirstClaimed) return alert("請先啟動首次重疾");
  state.totalClaimed += state.sumWhole;
  state.currentAge += 3;
  addLog("🧬 癌症復發賠償", formatCurrency(state.sumWhole));
  updateUI();
}

function triggerWaiver() {
  document.getElementById('dispPayStatus').innerText = "保費豁免";
  document.getElementById('waiverStatusBar').style.border = "2px solid #27ae60";
  addLog("⚠️ 觸發豁免", "未來保費 $0");
}

// --- 輔助功能 ---
function formatCurrency(amt) {
  return (state.currency === 'CNY' ? '¥' : '$') + Math.round(amt).toLocaleString();
}

function addLog(evt, amt) {
  const li = document.createElement('li');
  li.innerHTML = `<span>[${state.currentAge}歲] ${evt}</span> <strong>${amt}</strong>`;
  document.getElementById('logList').prepend(li);
}

function updateUI() {
  document.getElementById('dispAge').innerText = state.currentAge;
  document.getElementById('dispTotalClaim').innerText = formatCurrency(state.totalClaimed);
}

function formatMoneyInput(el) {
  let val = el.value.replace(/,/g, '').replace(/[^\d]/g, '');
  if(val) el.value = Number(val).toLocaleString();
}

function zoomImg(src) {
  document.getElementById('zoomedImg').src = src;
  document.getElementById('zoomOverlay').style.display = 'flex';
}

function showModal(id) {
  closeAllModals();
  document.getElementById(id).style.display = 'flex';
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
}

// --- 分享與存檔 ---
function generateShareQR() {
  const name = document.getElementById('clientNameInput').value || '貴賓';
  const url = `${window.location.origin}${window.location.pathname}?shared=1&n=${encodeURIComponent(name)}&a=${state.startAge}&s=${state.sumWhole}&m=${state.mode}&c=${state.currency}`;
  document.getElementById('qrcode').innerHTML = "";
  new QRCode(document.getElementById('qrcode'), { text: url, width: 200, height: 200 });
  showModal('qrModal');
}

function saveClientData() {
  let name = document.getElementById('clientNameInput').value;
  if(!name) return alert("請輸入方案名");
  let list = JSON.parse(localStorage.getItem('tot_v2') || "[]");
  list.push({ name, a: state.startAge, s: state.sumWhole, m: state.mode });
  localStorage.setItem('tot_v2', JSON.stringify(list));
  updateClientDropdown();
  alert("保存成功");
}

function updateClientDropdown() {
  let list = JSON.parse(localStorage.getItem('tot_v2') || "[]");
  let sel = document.getElementById('clientSelect');
  sel.innerHTML = '<option value="">-- 選擇客戶 --</option>';
  list.forEach((c, i) => sel.add(new Option(c.name, i)));
}

function loadSelectedClient() {
  let idx = document.getElementById('clientSelect').value;
  if(idx === "") return;
  let c = JSON.parse(localStorage.getItem('tot_v2'))[idx];
  document.getElementById('clientNameInput').value = c.name;
  document.getElementById('startAge').value = c.a;
  document.getElementById('sumWhole').value = c.s.toLocaleString();
  setMode(c.m);
}
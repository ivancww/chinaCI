/** 生活应急保险库 v2.7 - 核心逻辑 **/

let state = {
  mode: 'adult',
  startAge: 30,
  currentAge: 30,
  sumWhole: 1000000,
  totalClaimed: 0,
  isFirstClaimed: false,
  currency: 'USD',
  exchangeRate: 7.2,
  waiverActive: false
};

// --- 初始化與基礎功能 ---
async function fetchExchangeRate() {
  try {
    let res = await fetch('https://open.er-api.com/v6/latest/USD');
    let data = await res.json();
    state.exchangeRate = data.rates.CNY || 7.2;
  } catch(e) { console.log("使用預設匯率"); }
}

function formatMoneyInput(el) {
  let val = el.value.replace(/,/g, '').replace(/[^\d]/g, '');
  if(val) el.value = Number(val).toLocaleString();
}

function formatCurrency(amt) {
  let displayAmt = state.currency === 'CNY' ? amt * state.exchangeRate : amt;
  let symbol = state.currency === 'CNY' ? '¥' : '$';
  return symbol + Math.round(displayAmt).toLocaleString();
}

// --- 業務邏輯 ---
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
  state.sumWhole = state.currency === 'CNY' ? rawSum / state.exchangeRate : rawSum;
  state.totalClaimed = 0;
  state.isFirstClaimed = false;
  state.waiverActive = false;
  
  document.getElementById('logList').innerHTML = "";
  updateUI();
  addLog("🛡️ 保单生效", formatCurrency(state.sumWhole));
}

function triggerFirstClaim() {
  if(state.isFirstClaimed) return;
  state.isFirstClaimed = true;
  state.totalClaimed += parseFloat(state.sumWhole);
  state.currentAge += 2;
  addLog("🚨 首次重疾理賠", formatCurrency(state.sumWhole));
  updateUI();
}

function triggerEarlyStage() {
  let amt = state.sumWhole * 0.2;
  state.totalClaimed += amt;
  state.currentAge += 1;
  addLog("🩺 轻疾理赔", formatCurrency(amt));
  updateUI();
}

function triggerCancerLump() {
  if(!state.isFirstClaimed) return alert("請先觸發首次重疾");
  state.totalClaimed += parseFloat(state.sumWhole);
  state.currentAge += 3;
  addLog("🧬 癌症復發提款", formatCurrency(state.sumWhole));
  updateUI();
}

function triggerWaiver(type) {
  state.waiverActive = true;
  document.getElementById('dispPayStatus').innerText = "保费豁免";
  document.getElementById('waiverStatusBar').style.border = "2px solid #27ae60";
  addLog("⚠️ 觸發豁免", "未來保費 $0");
}

function addLog(evt, amt) {
  const li = document.createElement('li');
  li.innerHTML = `<span>[${state.currentAge}岁] ${evt}</span> <strong>${amt}</strong>`;
  document.getElementById('logList').prepend(li);
}

function updateUI() {
  document.getElementById('dispAge').innerText = state.currentAge;
  document.getElementById('dispTotalClaim').innerText = formatCurrency(state.totalClaimed);
}

// --- 圖片縮放與彈窗 ---
function zoomImg(src) {
  const overlay = document.getElementById('zoomOverlay');
  document.getElementById('zoomedImg').src = src;
  overlay.style.display = 'flex';
}

function showModal(id) {
  closeAllModals();
  document.getElementById(id).style.display = 'flex';
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
}

// --- 強制更新功能 ---
function forceUpdateApp() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.update();
      }
      alert("🚀 更新指令已發送！請關閉 App 並重新開啟以加載最新版本。");
      location.reload(true);
    });
  } else {
    location.reload(true);
  }
}

// --- CRM 檔案管理 ---
function saveClientData() {
  let name = document.getElementById('clientNameInput').value;
  if(!name) return alert("請輸入客戶名");
  let data = { name, age: state.startAge, sum: state.sumWhole, mode: state.mode };
  let list = JSON.parse(localStorage.getItem('tot_clients') || "[]");
  list.push(data);
  localStorage.setItem('tot_clients', JSON.stringify(list));
  updateClientDropdown();
  alert("保存成功");
}

function updateClientDropdown() {
  let list = JSON.parse(localStorage.getItem('tot_clients') || "[]");
  let sel = document.getElementById('clientSelect');
  sel.innerHTML = '<option value="">-- 选择已保存客户 --</option>';
  list.forEach((item, idx) => {
    let opt = document.createElement('option');
    opt.value = idx;
    opt.text = item.name;
    sel.appendChild(opt);
  });
}

function generateShareQR() {
  const shareUrl = window.location.href + "?shared=1&n=" + encodeURIComponent(document.getElementById('clientNameInput').value);
  const qrContainer = document.getElementById('qrcode-source');
  qrContainer.innerHTML = '';
  new QRCode(qrContainer, { text: shareUrl, width: 200, height: 200 });
  setTimeout(() => {
    const canvas = qrContainer.querySelector('canvas');
    document.getElementById('final-qr-img').src = canvas.toDataURL("image/png");
    showModal('shareQRModal');
  }, 300);
}

window.onload = () => {
  fetchExchangeRate();
  updateClientDropdown();
};
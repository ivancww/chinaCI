/* * 生活应急保险库 v2.12 - 核心逻辑 (图片自适应版) */

let state = {
  mode: 'adult',
  startAge: 30,
  currentAge: 30,
  sumWhole: 1000000, 
  upgradeBonus: 0, 
  totalClaimed: 0,
  cancerMonths: 0,
  heartStrokeCount: 0,
  isFirstClaimed: false,
  waiverActive: false,
  currency: 'USD',
  exchangeRate: 1
};

// ... (fetchExchangeRate, changeCurrency, formatMoneyInput, formatMoney, addLog 函數維持不變) ...

async function fetchExchangeRate() {
  try {
    let res = await fetch('https://open.er-api.com/v6/latest/USD');
    let data = await res.json();
    if (data && data.rates && data.rates.CNY) {
      state.exchangeRate = data.rates.CNY;
      document.getElementById('exchangeRateVal').innerText = state.exchangeRate.toFixed(4);
    }
  } catch (error) {
    console.error("Fetch API failed, using fallback exchange rate.");
    state.exchangeRate = 7.15; 
    document.getElementById('exchangeRateVal').innerText = "7.1500 (离线预设)";
  }
}

function changeCurrency() {
  state.currency = document.getElementById('currencySelect').value;
  if (state.currency === 'CNY') {
    document.getElementById('rateDisplay').style.display = 'block';
  } else {
    document.getElementById('rateDisplay').style.display = 'none';
  }
  let displayVal = state.sumWhole * (state.currency === 'CNY' ? state.exchangeRate : 1);
  document.getElementById('sumWhole').value = Math.round(displayVal).toLocaleString('en-US');
  initDashboard(); 
}

function formatMoneyInput(input) {
  let v = input.value.replace(/,/g, '').replace(/[^\d]/g, '');
  if(v) {
    input.value = Number(v).toLocaleString('en-US');
    let rawVal = Number(v);
    state.sumWhole = state.currency === 'CNY' ? (rawVal / state.exchangeRate) : rawVal;
  }
}

function formatMoney(usdAmount) {
  let converted = usdAmount * (state.currency === 'CNY' ? state.exchangeRate : 1);
  let sym = state.currency === 'CNY' ? '¥' : '$';
  return sym + converted.toLocaleString('en-US', {maximumFractionDigits: 0});
}

function addLog(age, event, amountStr, badgeLabel = '') {
  const ul = document.getElementById('logList');
  const li = document.createElement('li');
  let badge = badgeLabel ? `<span class="log-badge">${badgeLabel}</span> ` : '';
  li.innerHTML = `<span>[${age}岁] ${badge}${event}</span> <span style="color:#2ecc71; font-weight:bold;">${amountStr}</span>`;
  ul.prepend(li);
}

function setMode(selectedMode) {
  state.mode = selectedMode;
  document.getElementById('btnAdultMode').className = selectedMode === 'adult' ? 'mode-btn active' : 'mode-btn';
  document.getElementById('btnChildMode').className = selectedMode === 'child' ? 'mode-btn active' : 'mode-btn';
  
  document.getElementById('adultControls').style.display = selectedMode === 'adult' ? 'block' : 'none';
  document.getElementById('childControls').style.display = selectedMode === 'child' ? 'block' : 'none';
  document.getElementById('dementiaControlCard').style.display = selectedMode === 'child' ? 'block' : 'none';

  document.getElementById('startAge').value = selectedMode === 'adult' ? 30 : 0;
  
  let insight = selectedMode === 'adult' 
    ? "👨‍💼 <b>顶梁柱模式启动：</b>专注大病收入补偿。重点演示“抗癌月薪”及“配偶豁免”。"
    : "👶 <b>吞金兽模式启动：</b>专注爱与传承。重点演示“脑退化年金”、“ADHD特教金”及“父母双豁免”。";
  document.getElementById('insightText').innerHTML = insight;
}

function initDashboard() {
  state.startAge = parseInt(document.getElementById('startAge').value);
  state.currentAge = state.startAge;
  state.totalClaimed = 0;
  state.cancerMonths = 0;
  state.heartStrokeCount = 0;
  state.isFirstClaimed = false;
  state.waiverActive = false;

  let bonusRate = state.startAge <= 30 ? 0.50 : 0.35;
  state.upgradeBonus = state.sumWhole * bonusRate;
  
  let banner = document.getElementById('bonusBanner');
  banner.style.display = 'block';
  banner.innerHTML = `🎁 尊享首10年升级保障：免费送 ${bonusRate * 100}% 保额 (+${formatMoney(state.upgradeBonus)})`;

  let cancerMonthly = state.sumWhole * 0.05;
  document.getElementById('cancerCashAmountTxt').innerText = `每月金额: ${formatMoney(cancerMonthly)}`;

  document.getElementById('dispAge').innerText = state.currentAge + " 岁";
  
  const claimEl = document.getElementById('dispTotalClaim');
  claimEl.innerText = formatMoney(0);
  claimEl.classList.remove('flash-text');
  
  document.getElementById('dispPayStatus').innerText = "正常缴费";
  document.getElementById('heartStrokeCountTxt').innerText = "(0/3次)";
  
  document.getElementById('waiverStatusBar').classList.remove('waiver-active');
  document.getElementById('btnFirstClaim').disabled = false;
  document.getElementById('btnEarlyStage').disabled = false;
  document.getElementById('btnCancerLump').disabled = false;
  document.getElementById('btnCancerCash').disabled = false;
  document.getElementById('btnHeartStroke').disabled = false;
  document.getElementById('logList').innerHTML = "";
  
  addLog(state.currentAge, "🛡️ 保单正式生效", `重疾险保额 ${formatMoney(state.sumWhole)}`);
}

// ... (所有 trigger 理賠邏輯函數維持不變) ...

function triggerEarlyStage() {
  state.currentAge += 1;
  let rawAmt = state.sumWhole * 0.20;
  let earlyAmt = Math.min(rawAmt, 50000); 
  
  state.totalClaimed += earlyAmt;
  updateUI();
  addLog(state.currentAge, "🩺 轻疾理赔 (含44种)", `+${formatMoney(earlyAmt)}`, "早赔早治");
  document.getElementById('insightText').innerHTML = "<b>TOT 解析：</b>轻疾理赔 20%（上限5万美元）。不用等拖成重症，发现早期病征直接拿钱治病！";
}

function triggerFirstClaim() {
  if(state.isFirstClaimed) return alert("首次重疾已被激活！");
  state.currentAge += 2; 
  state.isFirstClaimed = true;
  
  let totalPay = state.sumWhole;
  let logTxt = "🚨 首次重疾确诊 (含58种)";
  
  if ((state.currentAge - state.startAge) < 10) {
    totalPay += state.upgradeBonus;
    logTxt = `🚨 首次重疾 (100% + 升级保障)`;
  }
  
  state.totalClaimed += totalPay;
  
  document.getElementById('btnFirstClaim').disabled = true;
  updateUI();
  addLog(state.currentAge, logTxt, `+${formatMoney(totalPay)}`, "底盘防御");
  document.getElementById('insightText').innerHTML = "<b>TOT 解析：</b>首次重疾理赔完成！如果在首10年内，触发额外的免费赠送保额！接下来，10X多重危疾防御网正式启动。";
}

function triggerCancerLump() {
  if(!state.isFirstClaimed) return alert("请先启动首次重疾！");
  state.currentAge += 3; 
  state.totalClaimed += state.sumWhole;
  updateUI();
  addLog(state.currentAge, "🧬 癌症复发 (方案A: 100%提款)", `+${formatMoney(state.sumWhole)}`);
}

function triggerCancerCash() {
  if(!state.isFirstClaimed) return alert("请先启动首次重疾！");
  document.getElementById('btnCancerLump').disabled = true; 
  
  state.currentAge += 1; 
  let monthlyCash = state.sumWhole * 0.05;
  state.cancerMonths += 1;
  state.totalClaimed += monthlyCash;
  
  updateUI();
  addLog(state.currentAge, `💸 抗癌月薪发放 (第${state.cancerMonths}个月)`, `+${formatMoney(monthlyCash)}`, "持续现金流");
  document.getElementById('insightText').innerHTML = "<b>TOT 解析：</b>方案 B“抗癌月薪”启动！最长100个月，每月固定入账 5%，完美替代生病期间中断的收入！";
}

function triggerHeartStroke() {
  if(!state.isFirstClaimed) return alert("请先启动首次重疾！");
  if(state.heartStrokeCount >= 3) return alert("心脑血管理赔已达3次最高上限！");
  
  state.currentAge += 1; 
  state.heartStrokeCount += 1;
  state.totalClaimed += state.sumWhole;
  
  document.getElementById('heartStrokeCountTxt').innerText = `(${state.heartStrokeCount}/3次)`;
  if(state.heartStrokeCount >= 3) {
    document.getElementById('btnHeartStroke').disabled = true;
  }
  
  updateUI();
  addLog(state.currentAge, `❤️ 心脏病/中风理赔 (第${state.heartStrokeCount}次)`, `+${formatMoney(state.sumWhole)}`);
}

function triggerDementia() {
  if(!state.isFirstClaimed) return alert("请先启动首次重疾！");
  state.currentAge += 1;
  let annuityAmt = state.sumWhole * 0.06;
  state.totalClaimed += annuityAmt;
  updateUI();
  addLog(state.currentAge, "🧠 脑退化/帕金森 终身护理金", `+${formatMoney(annuityAmt)}`, "养老防线");
  document.getElementById('insightText').innerHTML = "<b>TOT 解析：</b>脑退化年金启动！每年发放 6% 作为专属护理费，活多久领多久，给晚年最体面的尊严。";
}

function triggerChildGrowth(type) {
  state.currentAge += 1;
  let claimAmt = state.sumWhole * 0.20; 
  state.totalClaimed += claimAmt;
  let diseaseName = type === 'adhd' ? "专注力不足(ADHD)" : "妥瑞症";
  updateUI();
  addLog(state.currentAge, `🧸 儿童成长保障: ${diseaseName}`, `+${formatMoney(claimAmt)}`);
}

function triggerWaiver(who) {
  if(state.waiverActive) return;
  state.waiverActive = true;
  state.currentAge += 1;
  
  document.getElementById('dispPayStatus').innerText = "保费全免 (豁免)";
  document.getElementById('waiverStatusBar').classList.add('waiver-active');
  
  let text = who === 'spouse' ? "配偶身故豁免" : "父母身故双豁免";
  addLog(state.currentAge, `⚠️ 触发 ${text}`, "未来保费 ¥/$ 0", "定海神针");
  
  let insight = who === 'spouse' 
    ? "<b>TOT 解析：</b>配偶豁免生效！留爱不留债，生存的一方无需再为保费发愁。"
    : "<b>TOT 解析：</b>父母双豁免生效！真正的双保险，无论爸爸还是妈妈发生意外，都不会让孩子的保护伞断供。";
  document.getElementById('insightText').innerHTML = insight;
}

function updateUI() {
  document.getElementById('dispAge').innerText = state.currentAge + " 岁";
  
  const claimEl = document.getElementById('dispTotalClaim');
  claimEl.innerText = formatMoney(state.totalClaimed);
  
  claimEl.classList.remove('flash-text');
  void claimEl.offsetWidth; 
  claimEl.classList.add('flash-text');
}

// ... (switchNav, 彈窗控制, CRM 邏輯維持不變) ...

function switchNav(nav) {
  if(nav === 'sandbox') {
    closeCancerModal();
    closeThreeInOneModal();
  }
}
function showCancerModal() {
  document.getElementById('threeInOneModal').style.display = 'none';
  document.getElementById('cancerModal').style.display = 'flex';
}
function closeCancerModal() { document.getElementById('cancerModal').style.display = 'none'; }

function showThreeInOneModal() {
  document.getElementById('cancerModal').style.display = 'none';
  document.getElementById('threeInOneModal').style.display = 'flex';
}
function closeThreeInOneModal() { document.getElementById('threeInOneModal').style.display = 'none'; }


// --- 客户管理与私域分享逻辑 (CRM 核心) ---
function getSavedClients() {
  let clients = localStorage.getItem('tot_clients_list');
  return clients ? JSON.parse(clients) : [];
}

function updateClientDropdown() {
  let clients = getSavedClients();
  let select = document.getElementById('clientSelect');
  select.innerHTML = '<option value="">-- 选择已保存客户 --</option>';
  clients.forEach(c => {
    let opt = document.createElement('option');
    opt.value = c.name;
    opt.text = c.name;
    select.appendChild(opt);
  });
}

function saveClientData() {
  const name = document.getElementById('clientNameInput').value.trim();
  if(!name) return alert("请输入客户/方案名！");
  
  const data = {
    name: name,
    age: document.getElementById('startAge').value,
    sumWhole: state.sumWhole,
    mode: state.mode,
    currency: state.currency
  };
  
  let clients = getSavedClients();
  let idx = clients.findIndex(c => c.name === name);
  if(idx >= 0) {
    if(confirm(`客户档案【${name}】已存在，是否覆盖更新？`)) {
      clients[idx] = data;
    } else { return; }
  } else {
    clients.push(data);
  }
  
  localStorage.setItem('tot_clients_list', JSON.stringify(clients));
  updateClientDropdown();
  document.getElementById('clientSelect').value = name;
  alert(`✅ 方案【${name}】已成功保存在本地数据库！`);
}

function deleteClientData() {
  let name = document.getElementById('clientSelect').value;
  if(!name) return alert("请先从下拉菜单选择要删除的档案！");
  if(confirm(`确定要彻底删除【${name}】的档案吗？`)) {
    let clients = getSavedClients().filter(c => c.name !== name);
    localStorage.setItem('tot_clients_list', JSON.stringify(clients));
    updateClientDropdown();
    document.getElementById('clientNameInput').value = "";
    alert("🗑️ 删除成功！");
  }
}

function loadSelectedClient() {
  let name = document.getElementById('clientSelect').value;
  if(!name) return;
  
  let client = getSavedClients().find(c => c.name === name);
  if(client) {
    document.getElementById('clientNameInput').value = client.name;
    document.getElementById('startAge').value = client.age;
    state.sumWhole = client.sumWhole;
    
    document.getElementById('currencySelect').value = client.currency || 'USD';
    state.currency = client.currency || 'USD';
    if (state.currency === 'CNY') {
      document.getElementById('rateDisplay').style.display = 'block';
    } else {
      document.getElementById('rateDisplay').style.display = 'none';
    }
    let displayVal = state.sumWhole * (state.currency === 'CNY' ? state.exchangeRate : 1);
    document.getElementById('sumWhole').value = Math.round(displayVal).toLocaleString('en-US');

    setMode(client.mode || 'adult');
    initDashboard();
  }
}

function exportClientData() {
  const data = localStorage.getItem('tot_clients_list');
  if(!data || JSON.parse(data).length === 0) return alert("当前客户库为空，没有可以导出的数据！");
  const blob = new Blob([data], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "TOT_专属客户档案库.json";
  a.click();
}

function importClientData(event) {
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const newData = JSON.parse(e.target.result);
      if(Array.isArray(newData)) {
        if(confirm(`检测到 ${newData.length} 笔客户档案，是否覆盖当前本地数据库？`)) {
          localStorage.setItem('tot_clients_list', JSON.stringify(newData));
          updateClientDropdown();
          alert("✅ 客户库导入成功！");
        }
      } else {
        alert("❌ 文件格式不兼容！请使用正确的档案库文件。");
      }
    } catch(err) {
      alert("❌ 文件读取失败或格式错误！");
    }
  };
  reader.readAsText(file);
}

function generateShareQR() {
  const name = document.getElementById('clientNameInput').value.trim() || "贵宾";
  const params = new URLSearchParams();
  params.append('shared', '1');
  params.append('n', encodeURIComponent(name));
  params.append('a', document.getElementById('startAge').value);
  params.append('s', state.sumWhole);
  params.append('m', state.mode);
  params.append('c', state.currency);

  const shareUrl = window.location.origin + window.location.pathname + "?" + params.toString();
  
  const qrContainer = document.getElementById('qrcode-source');
  qrContainer.innerHTML = '';
  
  new QRCode(qrContainer, {
    text: shareUrl,
    width: 256,
    height: 256,
    colorDark : "#2c3e50",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });

  setTimeout(() => {
    const canvas = qrContainer.querySelector('canvas');
    if(canvas) {
      document.getElementById('final-qr-img').src = canvas.toToDataURL("image/png");
    }
  }, 200);

  document.getElementById('shareQRModal').style.display = 'flex';
}

function checkSharedMode() {
  const params = new URLSearchParams(window.location.search);
  if(params.get('shared') === '1') {
    document.body.classList.add('shared-mode');
    
    const name = decodeURIComponent(params.get('n') || '贵宾');
    const vipBanner = document.getElementById('vipBanner');
    vipBanner.innerHTML = `🌟 尊贵的 ${name} 您好，您的专属顾问为您定制了以下防御矩阵`;
    vipBanner.style.display = 'block';

    document.getElementById('startAge').value = params.get('a') || 30;
    state.sumWhole = parseFloat(params.get('s')) || 1000000;
    
    const curr = params.get('c') || 'USD';
    document.getElementById('currencySelect').value = curr;
    
    const mode = params.get('m') || 'adult';
    changeCurrency(); 
    setMode(mode);
    initDashboard();
  } else {
    updateClientDropdown();
    setMode('adult');
  }
}

// ================= 新增：初始化圖片查看器函數 =================
function initImageViewers() {
  // 定義需要支援縮放的圖片 ID 陣列
  const imgIds = ['imgCancerA', 'imgCancerB', 'imgThreeInOne1', 'imgThreeInOne2'];
  
  imgIds.forEach(id => {
    const imgEl = document.getElementById(id);
    if (imgEl) {
      // 為每張圖片初始化 Viewer.js
      // 配置：隱藏工具欄和標題，優化手機體驗
      new Viewer(imgEl, {
        toolbar: false,
        title: false,
        navbar: false,
        tooltip: false,
        movable: true,
        zoomable: true,
        rotatable: false,
        scalable: false,
        transition: true,
        fullscreen: false,
        keyboard: true
      });
    }
  });
}
// ===========================================================

// 默认启动
window.onload = async () => {
  await fetchExchangeRate();
  checkSharedMode();
  // ================= 更新：網頁下載完成後初始化圖片查看器 =================
  initImageViewers();
  // ===================================================================
}
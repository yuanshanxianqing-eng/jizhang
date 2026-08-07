// ========== 开屏动画设置 ==========
function saveSettings() {
  appData.settings.title = document.getElementById('settingTitle').value || '我的小金库 ♡';
  appData.settings.subtitle = document.getElementById('settingSubtitle').value || '慢慢存钱，也慢慢变富';
  appData.settings.freeLabel = document.getElementById('settingFreeLabel').value || '♡ 自由支配余额';
  const tagStr = document.getElementById('settingTags').value;
  appData.settings.tags = tagStr ? tagStr.split(',').map(t=>t.trim()).filter(t=>t) : [];
  appData.settings.salaryDay = parseInt(document.getElementById('settingSalaryDay').value) || 0;
  appData.settings.salaryText = document.getElementById('settingSalaryText').value || '距离发工资';
  const oldInitBalance = Number(appData.settings.initBalance) || 0;
const newInitBalance = parseFloat(document.getElementById('settingInitBalance').value) || 0;

if (oldInitBalance !== newInitBalance) {
  const ok = confirm(
    '修改初始余额会影响全部历史余额和账户实际余额。\n\n确定要继续修改吗？'
  );

  if (!ok) {
    document.getElementById('settingInitBalance').value = oldInitBalance || '';
    return;
  }
}

appData.settings.initBalance = newInitBalance;
  appData.settings.cycleStart = parseInt(document.getElementById('settingCycleStart').value) || 1;
  saveData();
  closeModal('settingsModal');
  renderAll();
}

function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { appData.settings.avatar = ev.target.result; saveData(); renderHeader(); };
  reader.readAsDataURL(file);
}

function handleBgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { appData.settings.bgImage = ev.target.result; saveData(); applyBg(); };
  reader.readAsDataURL(file);
}

function handleSalaryIconUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { appData.settings.salaryIcon = ev.target.result; saveData(); renderSalaryCountdown(); };
  reader.readAsDataURL(file);
}

function saveSplashSettings() {
  appData.splash.mainText = document.getElementById('splashMainText').value || '我的小金库 ♡';
  appData.splash.subText = document.getElementById('splashSubText').value || '慢慢存钱，也慢慢变富';
  appData.splash.duration = parseInt(document.getElementById('splashDuration').value) || 3000;
  const checked = document.querySelector('input[name="splashAnim"]:checked');
  appData.splash.animation = checked ? checked.value : 'bubbles';
  saveData();
  closeModal('splashSettingsModal');
}

function previewSplash() {
  appData.splash.mainText = document.getElementById('splashMainText').value || '我的小金库 ♡';
  appData.splash.subText = document.getElementById('splashSubText').value || '慢慢存钱，也慢慢变富';
  const checked = document.querySelector('input[name="splashAnim"]:checked');
  appData.splash.animation = checked ? checked.value : 'bubbles';
  appData.splash.duration = parseInt(document.getElementById('splashDuration').value) || 3000;
  const splash = document.getElementById('splashScreen');
  splash.style.display = 'flex';
  splash.classList.remove('hide');
  closeModal('splashSettingsModal');
  showSplash();
  setTimeout(() => openModal('splashSettingsModal'), (appData.splash.duration||3000) + 600);
}

// ========== 收入 ==========
function saveIncome() {
  const amount = parseFloat(document.getElementById('incomeAmount').value);
  const source = document.getElementById('incomeSource').value.trim();
  const date = document.getElementById('incomeDate').value;
  if (!amount || amount <= 0) { alert('请输入有效金额'); return; }
  if (!date) { alert('请选择日期'); return; }
  appData.incomes.push({ amount, source: source || '未知来源', date });
  saveData();
  closeModal('addIncomeModal');
  document.getElementById('incomeAmount').value = '';
  document.getElementById('incomeSource').value = '';
  renderAll();
}

function deleteIncome(idx) {
  const inc = appData.incomes[idx];

  const msg = inc
    ? `确定删除这条收入记录吗？\n\n金额：${formatMoney(inc.amount)}\n来源：${inc.source || '未知来源'}\n日期：${inc.date}\n\n注意：删除收入会影响账户实际余额和历史余额。`
    : '确定删除这条收入记录吗？\n\n注意：删除收入会影响账户实际余额和历史余额。';

  if (confirm(msg)) {
    appData.incomes.splice(idx, 1);
    saveData();
    renderAll();
  }
}

// ========== 支出 ==========
function saveExpense() {
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const note = document.getElementById('expenseNote').value.trim();
  const date = document.getElementById('expenseDate').value;
  if (!amount || amount <= 0) { alert('请输入有效金额'); return; }
  if (!date) { alert('请选择日期'); return; }
  appData.expenses.push({ amount, category: selectedCat1||'', subCategory: selectedCat2||'', tags: [...selectedTags], note, date, id: Date.now() });
  saveData();
  closeModal('addExpenseModal');
  document.getElementById('expenseAmount').value = '';
  document.getElementById('expenseNote').value = '';
  selectedCat1 = ''; selectedCat2 = ''; selectedTags = [];
  renderAll();
}

function deleteExpense(idx) {
  const exp = appData.expenses[idx];

  const msg = exp
    ? `确定删除这条支出记录吗？\n\n金额：${formatMoney(exp.amount)}\n分类：${exp.category || '未分类'}${exp.subCategory ? ' / ' + exp.subCategory : ''}\n日期：${exp.date}\n\n注意：删除支出会影响账户实际余额、预算统计和历史记录。`
    : '确定删除这条支出记录吗？\n\n注意：删除支出会影响账户实际余额、预算统计和历史记录。';

  if (confirm(msg)) {
    appData.expenses.splice(idx, 1);
    saveData();
    renderAll();
  }
}

// ========== 储存资金 ==========
function saveSavingRecord() {
  const amount = parseFloat(document.getElementById('savingAmount').value);
  const note = document.getElementById('savingNote').value.trim();
  const date = document.getElementById('savingDate').value;
  if (!amount || amount <= 0) { alert('请输入有效金额'); return; }
  if (!date) { alert('请选择日期'); return; }
  appData.savings.push({ amount, note: note||'储存', date, id: Date.now() });
  saveData();
  closeModal('addSavingModal');
  document.getElementById('savingAmount').value = '';
  document.getElementById('savingNote').value = '';
  renderAll();
}

function deleteSaving(idx) {
  const sv = appData.savings[idx];

  const msg = sv
    ? `确定删除这条储存记录吗？\n\n金额：${formatMoney(sv.amount)}\n备注：${sv.note || '储存'}\n日期：${sv.date}\n\n删除后，这笔钱会回到账户实际余额，也会影响对应存钱目标进度。`
    : '确定删除这条储存记录吗？\n\n删除后，这笔钱会回到账户实际余额，也会影响对应存钱目标进度。';

  if (confirm(msg)) {
    appData.savings.splice(idx, 1);
    saveData();
    renderAll();
  }
}

// ========== 存钱目标 ==========
function saveSavingGoal() {
  const name = document.getElementById('goalName').value.trim();
  const amount = parseFloat(document.getElementById('goalAmount').value);
  if (!name) { alert('请输入目标名称'); return; }
  if (!amount || amount <= 0) { alert('请输入有效目标金额'); return; }
  appData.savingGoals.push({ name, amount, id: Date.now() });
  saveData();
  closeModal('addGoalModal');
  document.getElementById('goalName').value = '';
  document.getElementById('goalAmount').value = '';
  renderSavingGoals();
}

function deleteSavingGoal(idx) {
  if (confirm('确定删除这个存钱目标吗？')) {
    appData.savingGoals.splice(idx, 1);
    saveData();
    renderSavingGoals();
  }
}

// ========== 常用预设 ==========
function savePresets() {
  appData.presets = tempPresets.filter(p => p.name && p.name.trim());
  saveData();
  closeModal('presetManageModal');
  renderQuickEntry();
}

function quickExpense(idx) {
  const preset = appData.presets[idx];
  if (!preset) return;
  if (confirm(`确定记一笔「${preset.name}」¥${(preset.amount||0).toFixed(2)} 吗？`)) {
    appData.expenses.push({ amount: preset.amount||0, category: preset.category||'', subCategory: preset.subCategory||'', tags: [], note: preset.name, date: todayStr(), id: Date.now() });
    saveData();
    renderAll();
  }
}

// ========== 数据导入导出 ==========
function exportData() {
  const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `小金库数据_${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData() {
  document.getElementById('importFileInput').click();
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (confirm('确定导入数据吗？这将覆盖当前所有数据。')) {
        appData = imported;
        const def = getDefaultData();
        if (!appData.settings) appData.settings = def.settings;
        if (!appData.splash) appData.splash = def.splash;
        if (!appData.budgetCategories) appData.budgetCategories = [];
        if (!appData.incomes) appData.incomes = [];
        if (!appData.expenses) appData.expenses = [];
        if (!appData.savings) appData.savings = [];
        if (!appData.savingGoals) appData.savingGoals = [];
        if (!appData.presets) appData.presets = [];
        if (!appData.aiSettings) appData.aiSettings = def.aiSettings;
        saveData();
        renderAll();
        alert('导入成功！');
      }
    } catch(err) { alert('导入失败：文件格式不正确。'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function deleteAllData() {
  if (confirm('⚠️ 确定要删除全部数据吗？此操作不可恢复！')) {
    if (confirm('再次确认：真的要删除所有数据吗？')) {
      localStorage.removeItem(STORAGE_KEY);
      appData = getDefaultData();
      saveData();
      renderAll();
      alert('已删除全部数据。');
    }
  }
}

function getActualBalanceValue() {
  const initBalance = appData.settings.initBalance || 0;
  const totalIncome = appData.incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalAllExpense = appData.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalSaved = appData.savings.reduce((s, sv) => s + (Number(sv.amount) || 0), 0);

  return initBalance + totalIncome - totalAllExpense - totalSaved;
}

function openBalanceAdjustModal() {
  const current = getActualBalanceValue();

  document.getElementById('balanceAdjustCurrent').value = formatMoney(current);
  document.getElementById('balanceAdjustTarget').value = '';
  document.getElementById('balanceAdjustNote').value = '';

  openModal('balanceAdjustModal');
}

function saveBalanceAdjust() {
  const current = getActualBalanceValue();
  const target = parseFloat(document.getElementById('balanceAdjustTarget').value);
  const note = document.getElementById('balanceAdjustNote').value.trim();

  if (Number.isNaN(target)) {
    alert('请输入真实账户余额');
    return;
  }

  const diff = Number((target - current).toFixed(2));

  if (diff === 0) {
    alert('当前余额已经一致，不需要校准。');
    return;
  }

  const ok = confirm(
    `当前系统余额：${formatMoney(current)}\n` +
    `目标真实余额：${formatMoney(target)}\n` +
    `校准差额：${formatMoney(diff)}\n\n` +
    `系统会自动新增一条${diff > 0 ? '收入' : '支出'}记录用于校准，确定继续吗？`
  );

  if (!ok) return;

  if (diff > 0) {
    appData.incomes.push({
      amount: diff,
      source: note || '余额校准',
      date: todayStr(),
      id: Date.now(),
      type: 'balance-adjust',
    });
  } else {
    appData.expenses.push({
      amount: Math.abs(diff),
      category: '',
      subCategory: '',
      tags: [],
      note: note || '余额校准',
      date: todayStr(),
      id: Date.now(),
      type: 'balance-adjust',
    });
  }

  saveData();
  closeModal('balanceAdjustModal');
  renderAll();

  alert('余额校准完成。');
}
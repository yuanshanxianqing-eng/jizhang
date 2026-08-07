// ========== 页面切换 ==========
function switchPage(pageId, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (pageId === 'pageStats') {
    renderStats();
    renderCalendar();
  }
  if (pageId === 'pageChat') {
    applyChatCustomize();
  }
  window.scrollTo(0, 0);
}

// ========== 模态框 ==========
function openModal(id) {
  document.getElementById(id).classList.add('show');
  document.body.style.overflow = 'hidden';
  if (id === 'addExpenseModal') {
    document.getElementById('expenseDate').value = todayStr();
    renderExpenseBubbles();
  }
  if (id === 'addIncomeModal') document.getElementById('incomeDate').value = todayStr();
  if (id === 'addSavingModal') document.getElementById('savingDate').value = todayStr();
  if (id === 'settingsModal') populateSettings();
  if (id === 'budgetManageModal') renderBudgetManage();
  if (id === 'splashSettingsModal') populateSplashSettings();
  if (id === 'presetManageModal') renderPresetManage();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  document.body.style.overflow = '';
}

// ========== 开屏动画 ==========
function showSplash() {
  const splash = document.getElementById('splashScreen');
  const textEl = document.getElementById('splashText');
  const subEl = document.getElementById('splashSub');
  const effectsEl = document.getElementById('splashEffects');

  textEl.textContent = appData.splash.mainText;
  subEl.textContent = appData.splash.subText;
  effectsEl.innerHTML = '';

  const anim = appData.splash.animation;
  if (anim === 'bubbles') {
    for (let i = 0; i < 20; i++) {
      const b = document.createElement('div');
      b.className = 'bubble';
      const size = Math.random() * 30 + 10;
      b.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;bottom:-${size}px;background:${Math.random()>0.5?'rgba(255,182,193,0.5)':'rgba(135,206,235,0.5)'};animation-delay:${Math.random()*3}s;animation-duration:${Math.random()*3+3}s`;
      effectsEl.appendChild(b);
    }
  } else if (anim === 'petals') {
    for (let i = 0; i < 15; i++) {
      const p = document.createElement('div');
      p.className = 'petal';
      p.style.cssText = `left:${Math.random()*100}%;top:-20px;animation-delay:${Math.random()*4}s;animation-duration:${Math.random()*3+4}s;background:rgba(255,${150+Math.random()*100|0},${180+Math.random()*50|0},0.6)`;
      effectsEl.appendChild(p);
    }
  } else if (anim === 'stars') {
    for (let i = 0; i < 30; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*2}s;animation-duration:${Math.random()*2+1}s`;
      effectsEl.appendChild(s);
    }
  }

  setTimeout(() => {
    splash.classList.add('hide');
    setTimeout(() => { splash.style.display = 'none'; }, 500);
  }, appData.splash.duration || 3000);
}

// ========== 头部渲染 ==========
function renderHeader() {
  document.getElementById('headerTitle').textContent = appData.settings.title;
  document.getElementById('headerSubtitle').textContent = appData.settings.subtitle;
  const avatarEl = document.getElementById('headerAvatar');
  avatarEl.innerHTML = appData.settings.avatar
    ? `<img src="${appData.settings.avatar}" alt="头像">`
    : '🏠';
}

// ========== 距离发工资 ==========
function renderSalaryCountdown() {
  const salaryDay = appData.settings.salaryDay;
  document.getElementById('salaryLabel').textContent = appData.settings.salaryText || '距离发工资';
  const salaryIconBox = document.getElementById('salaryIconBox');
  salaryIconBox.innerHTML = appData.settings.salaryIcon
    ? `<img src="${appData.settings.salaryIcon}" alt="">`
    : '◷';

  const salaryDaysEl = document.getElementById('salaryDays');
  if (!salaryDay || salaryDay < 1 || salaryDay > 31) {
    salaryDaysEl.innerHTML = '<span style="font-size:14px;">设置发工资日后显示</span>';
    return;
  }
  const now = new Date();
  if (now.getDate() === salaryDay) {
    salaryDaysEl.innerHTML = '🎉 <span>今天发工资！</span>';
    return;
  }
  const nextSalary = now.getDate() < salaryDay
    ? new Date(now.getFullYear(), now.getMonth(), salaryDay)
    : new Date(now.getFullYear(), now.getMonth() + 1, salaryDay);
  const diff = Math.ceil((nextSalary - now) / (1000 * 60 * 60 * 24));
  salaryDaysEl.innerHTML = `${diff} <span>天</span>`;
}

// ========== 余额计算 ==========
function calcBalances() {
  const initBalance = appData.settings.initBalance || 0;

  // 实际余额是银行/账户真实余额：初始余额 + 所有收入 - 所有支出 - 所有储存
  const totalIncome = appData.incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalAllExpense = appData.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalSaved = appData.savings.reduce((s, sv) => s + (Number(sv.amount) || 0), 0);
  const actualBalance = initBalance + totalIncome - totalAllExpense - totalSaved;

  // 本周期支出，只用于本月/本周期统计和预算计算
  const cycleExpenses = appData.expenses.filter(e => isInCurrentCycle(e.date));
  const totalExpenseThisCycle = cycleExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // 预算只扣有预算分类的支出
  const budgetCatNames = appData.budgetCategories.map(c => c.name);
  const categorizedExpenses = cycleExpenses.filter(e =>
    e.category && budgetCatNames.includes(e.category)
  );
  const categorizedTotal = categorizedExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // 计算预算总额：如果二级预算合计大于一级预算，就按二级合计算
  const totalBudget = appData.budgetCategories.reduce((s, c) => {
    let catBudget = Number(c.budget) || 0;

    if (c.subs && c.subs.length > 0) {
      const subTotal = c.subs.reduce((ss, sub) => ss + (Number(sub.budget) || 0), 0);
      if (subTotal > catBudget) catBudget = subTotal;
    }

    return s + catBudget;
  }, 0);

  // 剩余预算不能小于 0，超支后就按 0 算，避免影响自由支配余额
  const budgetRemaining = Math.max(0, totalBudget - categorizedTotal);

  // 关键修复：
  // actualBalance 已经扣过所有支出了，不能再额外扣未分类/随便花支出。
  // 自由支配余额 = 实际余额 - 还需要预留的预算。
  const freeBalance = actualBalance - budgetRemaining;

  document.getElementById('freeBalance').textContent = formatMoney(freeBalance);
  document.getElementById('actualBalance').textContent = formatMoney(actualBalance);
  document.getElementById('totalExpense').textContent = formatMoney(totalExpenseThisCycle);
  document.getElementById('totalSaved').textContent = formatMoney(totalSaved);
  document.getElementById('balanceLabelFree').textContent =
    appData.settings.freeLabel || '♡ 自由支配余额';

  const cycleIncomes = appData.incomes.filter(i => isInCurrentCycle(i.date));
  const totalCycleIncome = cycleIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  document.getElementById('incomeTotal').textContent = formatMoney(totalCycleIncome);

  document.getElementById('budgetRemaining').textContent = formatMoney(budgetRemaining);
}

// ========== 收入 ==========
function toggleIncomeDetail() {
  const detail = document.getElementById('incomeDetail');
  const icon = document.getElementById('incomeToggleIcon');
  detail.classList.toggle('expanded');
  icon.classList.toggle('rotated');
}

function renderIncomes() {
  const list = document.getElementById('incomeList');
  const cycleIncomes = appData.incomes.filter(i => isInCurrentCycle(i.date));
  if (cycleIncomes.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:12px 0;">暂无收入记录</div>';
    return;
  }
  list.innerHTML = cycleIncomes.map(inc => {
    const globalIdx = appData.incomes.indexOf(inc);
    return `<div class="income-item">
      <div class="info">
        <div class="source">${inc.source || '未知来源'}</div>
        <div class="date">${inc.date}</div>
      </div>
      <div class="amount">+${formatMoney(inc.amount)}</div>
      <button class="del-btn" onclick="deleteIncome(${globalIdx})">×</button>
    </div>`;
  }).join('');
}

// ========== 预算管理 ==========
let tempBudget = [];

function renderBudgetManage() {
  tempBudget = JSON.parse(JSON.stringify(appData.budgetCategories));
  renderBudgetManageList();
}

function renderBudgetManageList() {
  const list = document.getElementById('budgetManageList');
  if (tempBudget.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:20px 0;">暂无预算分类</div>';
    return;
  }
  list.innerHTML = tempBudget.map((cat, ci) => {
    const subsHtml = (cat.subs || []).map((sub, si) => `
      <div class="sub-row">
        <input type="text" value="${sub.name || ''}" placeholder="二级名称" onchange="tempBudget[${ci}].subs[${si}].name=this.value">
        <input type="number" value="${sub.budget || ''}" placeholder="预算" style="width:80px;" step="0.01" onchange="tempBudget[${ci}].subs[${si}].budget=parseFloat(this.value)||0">
        <button class="sub-del" onclick="tempBudget[${ci}].subs.splice(${si},1);renderBudgetManageList()">×</button>
      </div>`).join('');
    return `<div class="budget-manage-item">
      <div class="bm-header">
        <input type="text" value="${cat.name || ''}" placeholder="一级分类名称" onchange="tempBudget[${ci}].name=this.value">
        <input type="number" value="${cat.budget || ''}" placeholder="总预算" style="width:90px;" step="0.01" onchange="tempBudget[${ci}].budget=parseFloat(this.value)||0">
        <button class="bm-del" onclick="tempBudget.splice(${ci},1);renderBudgetManageList()">×</button>
      </div>
      <div class="budget-sub-manage">
        ${subsHtml}
        <button class="btn-small" style="font-size:11px;margin-top:4px;" onclick="if(!tempBudget[${ci}].subs)tempBudget[${ci}].subs=[];tempBudget[${ci}].subs.push({name:'',budget:0});renderBudgetManageList()">+ 添加二级</button>
      </div>
    </div>`;
  }).join('');
}

function addBudgetCategory() {
  tempBudget.push({ name: '', budget: 0, subs: [] });
  renderBudgetManageList();
}

function saveBudgetConfig() {
  appData.budgetCategories = tempBudget.filter(c => c.name && c.name.trim());
  appData.budgetCategories.forEach(c => {
    if (c.subs) c.subs = c.subs.filter(s => s.name && s.name.trim());
  });
  saveData();
  closeModal('budgetManageModal');
  renderAll();
}

// ========== 首页预算列表 ==========
function renderBudgetCategories() {
  const list = document.getElementById('budgetCategoryList');
  if (appData.budgetCategories.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:12px 0;">暂无预算分类</div>';
    return;
  }
  const cycleExpenses = appData.expenses.filter(e => isInCurrentCycle(e.date));
  list.innerHTML = appData.budgetCategories.map((cat, ci) => {
    const catSpent = cycleExpenses.filter(e => e.category === cat.name)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const catBudget = Number(cat.budget) || 0;
    const percent = catBudget > 0 ? Math.min(100, catSpent / catBudget * 100) : 0;
    const subsHtml = (cat.subs || []).map(sub => {
      const subSpent = cycleExpenses.filter(e => e.category === cat.name && e.subCategory === sub.name)
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const subBudget = Number(sub.budget) || 0;
      const subPct = subBudget > 0 ? Math.min(100, subSpent / subBudget * 100) : 0;
      return `<div class="budget-sub-item">
        <span class="sub-name">${sub.name}</span>
        <span class="sub-budget">${formatMoney(subSpent)} / ${formatMoney(subBudget)}</span>
      </div>
      <div class="budget-progress" style="margin:0 0 4px 0;">
        <div class="budget-progress-bar" style="width:${subPct}%;${subPct>80?'background:linear-gradient(135deg,#ff6b6b,#ee5a24)':''}"></div>
      </div>`;
    }).join('');
    return `<div class="budget-category">
      <div class="budget-cat-header" onclick="toggleBudgetCat(${ci})">
        <div class="cat-name">${cat.name}</div>
        <div class="cat-amount">${formatMoney(catSpent)} / ${formatMoney(catBudget)}
          ${cat.subs && cat.subs.length ? `<span class="toggle-arrow" id="budgetArrow${ci}">▼</span>` : ''}
        </div>
      </div>
      <div class="budget-progress" style="margin:0 12px;">
        <div class="budget-progress-bar" style="width:${percent}%;${percent>80?'background:linear-gradient(135deg,#ff6b6b,#ee5a24)':''}"></div>
      </div>
      <div class="budget-cat-body" id="budgetBody${ci}">${subsHtml}</div>
    </div>`;
  }).join('');
}

function toggleBudgetCat(ci) {
  document.getElementById('budgetBody' + ci).classList.toggle('expanded');
  const arrow = document.getElementById('budgetArrow' + ci);
  if (arrow) arrow.classList.toggle('rotated');
}

// ========== 支出 ==========
let selectedCat1 = '', selectedCat2 = '', selectedTags = [];

function renderExpenseBubbles() {
  selectedCat1 = ''; selectedCat2 = ''; selectedTags = [];
  const cat1Container = document.getElementById('expenseCat1Bubbles');
  cat1Container.innerHTML = appData.budgetCategories.length === 0
    ? '<span style="color:#888;font-size:12px;">请先添加预算分类</span>'
    : appData.budgetCategories.map(c =>
        `<span class="bubble-option" onclick="selectCat1(this,'${c.name}')">${c.name}</span>`
      ).join('');
  document.getElementById('expenseCat2Bubbles').innerHTML = '<span style="color:#888;font-size:12px;">请先选择一级分类</span>';
  const tags = appData.settings.tags || [];
  document.getElementById('expenseTagBubbles').innerHTML = tags.length === 0
    ? '<span style="color:#888;font-size:12px;">请在设置中添加标签</span>'
    : tags.map(t => `<span class="bubble-option" onclick="toggleTag(this,'${t}')">${t}</span>`).join('');
}

function selectCat1(el, name) {
  selectedCat1 = name;
  document.querySelectorAll('#expenseCat1Bubbles .bubble-option').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  selectedCat2 = '';
  const cat = appData.budgetCategories.find(c => c.name === name);
  const cat2Container = document.getElementById('expenseCat2Bubbles');
  cat2Container.innerHTML = (cat && cat.subs && cat.subs.length)
    ? cat.subs.map(s => `<span class="bubble-option" onclick="selectCat2(this,'${s.name}')">${s.name}</span>`).join('')
    : '<span style="color:#888;font-size:12px;">该分类无二级分类</span>';
}

function selectCat2(el, name) {
  selectedCat2 = name;
  document.querySelectorAll('#expenseCat2Bubbles .bubble-option').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

function toggleTag(el, tag) {
  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    selectedTags = selectedTags.filter(t => t !== tag);
  } else {
    el.classList.add('selected');
    selectedTags.push(tag);
  }
}

function renderExpenses() {
  const list = document.getElementById('expenseList');
  const cycleExpenses = appData.expenses.filter(e => isInCurrentCycle(e.date));
  if (cycleExpenses.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:20px 0 ;">暂无支出记录</div>';
    return;
  }
  const sorted = [...cycleExpenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  list.innerHTML = sorted.map(exp => {
    const globalIdx = appData.expenses.indexOf(exp);
    const subStr = exp.subCategory ? ` / ${exp.subCategory}` : '';
    const tagStr = (exp.tags || []).join(' · ');
    return `<div class="expense-item">
      <div class="icon">${getCategoryIcon(exp.category)}</div>
      <div class="detail">
        <div class="name">${exp.category || '未分类'}${subStr}</div>
        <div class="meta">${exp.date}${tagStr ? ' · '+tagStr : ''}${exp.note ? ' · '+exp.note : ''}</div>
      </div>
      <div class="expense-amount">-${formatMoney(exp.amount)}</div>
      <button class="del-btn" onclick="deleteExpense(${globalIdx})">×</button>
    </div>`;
  }).join('');
}

// ========== 标签 ==========
function renderTags() {
  const area = document.getElementById('tagsArea');
  const tags = appData.settings.tags || [];
  area.innerHTML = tags.length === 0
    ? '<span style="color:#888;font-size:12px;">暂无标签</span>'
    : tags.map(t => `<span class="tag">${t}</span>`).join('');
}

// ========== 储存资金 ==========
function renderSavingRecords() {
  const list = document.getElementById('savingRecordList');
  if (appData.savings.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:12px 0;">暂无储存记录</div>';
    return;
  }
  list.innerHTML = appData.savings.map((sv, idx) => `
    <div class="saving-record">
      <div class="info">
        <div class="note">${sv.note || '储存'}</div>
        <div class="date">${sv.date}</div>
      </div>
      <div class="amount">+${formatMoney(sv.amount)}</div>
      <button class="del-btn" onclick="deleteSaving(${idx})">×</button>
    </div>`).join('');
}

// ========== 存钱目标 ==========
function renderSavingGoals() {
  const list = document.getElementById('savingGoalList');
  if (appData.savingGoals.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:20px 0;">暂无存钱目标</div>';
    return;
  }
  const totalSaved = appData.savings.reduce((s, sv) => s + (Number(sv.amount) || 0), 0);
  list.innerHTML = appData.savingGoals.map((goal, idx) => {
    const target = Number(goal.amount) || 1;
    const percent = Math.min(100, totalSaved / target * 100);
    return `<div class="saving-goal-card">
      <div class="goal-header">
        <span class="goal-name">🎯 ${goal.name}</span>
        <span>
          <span class="goal-amount">${formatMoney(totalSaved)} / ${formatMoney(target)}</span>
          <button class="goal-del" onclick="deleteSavingGoal(${idx})">×</button>
        </span>
      </div>
      <div class="goal-progress-bar-bg">
        <div class="goal-progress-bar-fill" style="width:${percent}%"></div>
      </div>
      <div class="goal-percent">${percent.toFixed(1)}%</div>
    </div>`;
  }).join('');
}

// ========== 常用一键记账 ==========
let tempPresets = [];

function renderPresetManage() {
  tempPresets = JSON.parse(JSON.stringify(appData.presets));
  renderPresetManageList();
}

function renderPresetManageList() {
  const list = document.getElementById('presetList');
  if (tempPresets.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:12px 0;">暂无常用预设</div>';
    return;
  }
  list.innerHTML = tempPresets.map((p, i) => `
    <div class="preset-item">
      <div style="flex:1;">
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <input type="text" value="${p.name||''}" placeholder="名称" style="flex:1;padding:6px 8px;border:1px solid #e8e8e8;border-radius:8px;font-size:12px;outline:none;" onchange="tempPresets[${i}].name=this.value">
          <input type="number" value="${p.amount||''}" placeholder="金额" style="width:80px;padding:6px 8px;border:1px solid #e8e8e8;border-radius:8px;font-size:12px;outline:none;" step="0.01" onchange="tempPresets[${i}].amount=parseFloat(this.value)||0">
        </div>
        <div style="display:flex;gap:6px;">
          <input type="text" value="${p.category||''}" placeholder="分类" style="flex:1;padding:6px 8px;border:1px solid #e8e8e8;border-radius:8px;font-size:12px;outline:none;" onchange="tempPresets[${i}].category=this.value">
          <input type="text" value="${p.subCategory||''}" placeholder="二级分类" style="flex:1;padding:6px 8px;border:1px solid #e8e8e8;border-radius:8px;font-size:12px;outline:none;" onchange="tempPresets[${i}].subCategory=this.value">
        </div>
      </div>
      <button class="preset-del" onclick="tempPresets.splice(${i},1);renderPresetManageList()">×</button>
    </div>`).join('');
}

function addPresetItem() {
  tempPresets.push({ name: '', amount: 0, category: '', subCategory: '' });
  renderPresetManageList();
}

function renderQuickEntry() {
  const list = document.getElementById('quickEntryList');
  if (appData.presets.length === 0) {
    list.innerHTML = '<span style="color:#888;font-size:12px;">暂无常用预设，点击管理添加</span>';
    return;
  }
  list.innerHTML = appData.presets.map((p, i) =>
    `<button class="quick-btn" onclick="quickExpense(${i})">${getCategoryIcon(p.category)} ${p.name} ¥${(p.amount||0).toFixed(2)}</button>`
  ).join('');
}

// ========== 统计 ==========
function renderStats() {
  const cycleExpenses = appData.expenses.filter(e => isInCurrentCycle(e.date));
  const total = cycleExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  document.getElementById('statTotalExpense').textContent = formatMoney(total);
  document.getElementById('statCount').textContent = cycleExpenses.length;
  renderCategoryChart(cycleExpenses, total);
  renderDailyChart(cycleExpenses);
}

function renderCategoryChart(expenses, total) {
  const container = document.getElementById('categoryChart');
  if (expenses.length === 0) { container.innerHTML = '<div class="chart-placeholder">暂无数据</div>'; return; }
  const catMap = {};
  expenses.forEach(e => { const cat = e.category || '未分类'; catMap[cat] = (catMap[cat]||0) + (Number(e.amount)||0); });
  const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
  const maxVal = sorted[0][1] || 1;
  container.innerHTML = sorted.map(([cat, val]) => `
    <div class="category-bar">
      <div class="cat-label">${cat}</div>
      <div class="cat-bar-bg"><div class="cat-bar-fill" style="width:${(val/maxVal*100).toFixed(0)}%"></div></div>
      <div class="cat-val">${formatMoney(val)}</div>
    </div>`).join('');
}

function renderDailyChart(expenses) {
  const container = document.getElementById('dailyChart');
  if (expenses.length === 0) { container.innerHTML = '<div class="chart-placeholder">暂无数据</div>'; return; }
  const range = getCurrentCycleRange();
  const dayMap = {};
  for (let d = new Date(range.start); d <= new Date(range.end); d.setDate(d.getDate()+1)) {
    const key = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    dayMap[key] = 0;
  }
  expenses.forEach(e => { if (dayMap[e.date]!==undefined) dayMap[e.date] += Number(e.amount)||0; });
  const entries = Object.entries(dayMap);
  const maxVal = Math.max(...entries.map(e=>e[1]), 1);
  container.innerHTML = `<div class="daily-chart">
    ${entries.map(([date, val]) => {
      const day = parseInt(date.split('-')[2]);
      const h = val > 0 ? Math.max(8, val/maxVal*90) : 2;
      return `<div class="daily-bar" style="height:${h}px;" title="${date}: ${formatMoney(val)}"><div class="daily-bar-label">${day}</div></div>`;
    }).join('')}
  </div>
  <div style="text-align:center;font-size:11px;color:#888;margin-top:20px;">日期</div>`;
}

// ========== 日历 ==========
let calendarYear, calendarMonth;

function initCalendar() {
  const now = new Date();
  calendarYear = now.getFullYear();
  calendarMonth = now.getMonth();
  renderCalendar();
}

function changeCalendarMonth(delta) {
  calendarMonth += delta;
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  renderCalendar();
}

function renderCalendar() {
  const today = new Date();
  document.getElementById('todayIndicator').textContent = `今天：${today.getFullYear()}/${today.getMonth()+1}/${today.getDate()}`;
  document.getElementById('calendarMonthTitle').textContent = `${calendarYear}年${calendarMonth+1}月`;

  const grid = document.getElementById('calendarGrid');
  const dayNames = ['日','一','二','三','四','五','六'];
  let html = dayNames.map(d => `<div class="day-name">${d}</div>`).join('');

  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth+1, 0).getDate();
  const dailyExpenseMap = {};
  let maxDayExpense = 0;
  appData.expenses.forEach(e => {
    const ed = new Date(e.date);
    if (ed.getFullYear()===calendarYear && ed.getMonth()===calendarMonth) {
      const day = ed.getDate();
      dailyExpenseMap[day] = (dailyExpenseMap[day]||0) + (Number(e.amount)||0);
      if (dailyExpenseMap[day] > maxDayExpense) maxDayExpense = dailyExpenseMap[day];
    }
  });

  for (let i = 0; i < firstDay; i++) html += '<div class="day-cell"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d===today.getDate() && calendarMonth===today.getMonth() && calendarYear===today.getFullYear();
    let cls = 'day-cell' + (isToday ? ' today' : '');
    let dotHtml = '';
    if (dailyExpenseMap[d]) {
      const ratio = dailyExpenseMap[d] / (maxDayExpense||1);
      const dotClass = ratio > 0.66 ? 'high' : ratio > 0.33 ? 'medium' : 'low';
      cls += ' has-expense';
      dotHtml = `<div class="expense-dot ${dotClass}"></div>`;
    }
    html += `<div class="${cls}" onclick="showDayDetail(${d})">${d}${dotHtml}</div>`;
  }
  grid.innerHTML = html;
  document.getElementById('calendarDayDetail').classList.remove('show');
}

function showDayDetail(day) {
  const dateStr = `${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  document.getElementById('calendarDayTitle').textContent = `${calendarYear}年${calendarMonth+1}月${day}日`;
  const dayExpenses = appData.expenses.filter(e => e.date===dateStr);
  const dayIncomes = appData.incomes.filter(i => i.date===dateStr);
  let html = '';
  if (dayIncomes.length) {
    html += '<div style="font-size:12px;color:#4CAF50;margin-bottom:6px;">收入：</div>';
    dayIncomes.forEach(i => { html += `<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;"><span>${i.source}</span><span style="color:#4CAF50;">+${formatMoney(i.amount)}</span></div>`; });
  }
  if (dayExpenses.length) {
    html += '<div style="font-size:12px;color:#e53935;margin-bottom:6px;margin-top:6px;">支出：</div>';
    dayExpenses.forEach(e => {
      const sub = e.subCategory ? ` / ${e.subCategory}` : '';
      html += `<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;"><span>${e.category||'未分类'}${sub} ${e.note||''}</span><span style="color:#e53935;">-${formatMoney(e.amount)}</span></div>`;
    });
  }
  if (!dayIncomes.length && !dayExpenses.length) html = '<div style="text-align:center;color:#888;font-size:13px;">当天无记录</div>';
  document.getElementById('calendarDayRecords').innerHTML = html;
  document.getElementById('calendarDayDetail').classList.add('show');
}

// ========== 设置 ==========
function populateSettings() {
  document.getElementById('settingTitle').value = appData.settings.title || '';
  document.getElementById('settingSubtitle').value = appData.settings.subtitle || '';
  document.getElementById('settingFreeLabel').value = appData.settings.freeLabel || '';
  document.getElementById('settingTags').value = (appData.settings.tags||[]).join(',');
  document.getElementById('settingSalaryDay').value = appData.settings.salaryDay || '';
  document.getElementById('settingSalaryText').value = appData.settings.salaryText || '距离发工资';
  document.getElementById('settingInitBalance').value = appData.settings.initBalance || '';
  document.getElementById('settingCycleStart').value = appData.settings.cycleStart || 1;
}

function populateSplashSettings() {
  document.getElementById('splashMainText').value = appData.splash.mainText || '';
  document.getElementById('splashSubText').value = appData.splash.subText || '';
  document.getElementById('splashDuration').value = appData.splash.duration || 3000;
  document.querySelectorAll('input[name="splashAnim"]').forEach(r => { r.checked = r.value===appData.splash.animation; });
}

function applyBg() {
  if (appData.settings.bgImage) {
    document.body.style.backgroundImage = `url(${appData.settings.bgImage})`;
    document.body.classList.add('has-bg');
  } else {
    document.body.style.backgroundImage = '';
    document.body.classList.remove('has-bg');
  }
}

// ========== 全部渲染 ==========
function renderAll() {
  renderHeader();
  renderSalaryCountdown();
  calcBalances();
  renderIncomes();
  renderBudgetCategories();
  renderSavingGoals();
  renderQuickEntry();
  renderExpenses();
  renderTags();
  renderSavingRecords();
  applyBg();
}
// ============ 补丁：主题折叠 / 存钱目标分配 / API增强 ============

/* --------------------------------
   0. 安全默认值
-------------------------------- */

function patchEnsureAllDefaults() {
  // 主题
  if (!appData.themeSettings && typeof ensureThemeSettings === 'function') {
    ensureThemeSettings();
  }

  // AI设置
  if (!appData.aiSettings) appData.aiSettings = {};
  if (!appData.aiSettings.persona) {
    appData.aiSettings.persona = {
      avatar: '',
      name: '小金',
      personality: '你是一个可爱温柔的记账小助手。',
      callUser: '主人',
    };
  }
  if (!appData.aiSettings.stickers) appData.aiSettings.stickers = [];

  // API 增强字段
  if (appData.aiSettings.apiBaseUrl === undefined) appData.aiSettings.apiBaseUrl = '';
  if (appData.aiSettings.apiKey === undefined) appData.aiSettings.apiKey = '';
  if (appData.aiSettings.apiModel === undefined) appData.aiSettings.apiModel = 'gpt-4o';
  if (appData.aiSettings.apiAvailableModels === undefined) {
    appData.aiSettings.apiAvailableModels = [
      'gpt-4o',
      'gpt-4o-mini',
      'claude-3-5-sonnet',
      'deepseek-chat',
      'deepseek-reasoner'
    ];
  }

  // 三个实际调用端点，可自定义
  if (appData.aiSettings.apiChatEndpoint === undefined) appData.aiSettings.apiChatEndpoint = '/api/ai/chat';
  if (appData.aiSettings.apiParseEndpoint === undefined) appData.aiSettings.apiParseEndpoint = '/api/ai/parse-expense';
  if (appData.aiSettings.apiReceiptEndpoint === undefined) appData.aiSettings.apiReceiptEndpoint = '/api/ai/recognize-receipt';

  // 连接状态
  if (appData.aiSettings.apiConnectionStatus === undefined) {
    appData.aiSettings.apiConnectionStatus = {
      ok: false,
      message: '未测试',
      testedAt: '',
    };
  }

  // 存钱目标字段迁移
  if (!Array.isArray(appData.savingGoals)) appData.savingGoals = [];
  if (!Array.isArray(appData.savings)) appData.savings = [];

  appData.savingGoals.forEach(goal => {
    if (!goal.id) goal.id = Date.now() + Math.random();
  });

  appData.savings.forEach(sv => {
    if (sv.goalId === undefined) sv.goalId = '';
  });

  saveData();
}

/* --------------------------------
   1. 主题自定义可折叠
-------------------------------- */

// 覆盖原 renderThemeCustomizePanel
function renderThemeCustomizePanel() {
  patchEnsureAllDefaults();

  const box = document.getElementById('themeCustomizeBox');
  if (!box) return;

  const t = appData.themeSettings;

  box.innerHTML = `
    <div class="theme-fold-card" id="themeFoldCard">

      <div class="theme-fold-top" onclick="toggleThemeFold()">
        <div>
          <div class="theme-fold-title">主题自定义面板</div>
          <div class="theme-fold-sub">点击展开 / 收起颜色、背景、卡片、文字等设置</div>
        </div>
        <div class="theme-fold-arrow">▼</div>
      </div>

      <div class="theme-fold-body">

        ${themeAccordionBlock('总开关', `
          <div class="theme-row">
            <label>启用主题</label>
            <input type="checkbox" ${t.enabled ? 'checked' : ''} onchange="updateThemeValue('enabled', this.checked)">
            <span style="font-size:12px;color:#888;">关闭后恢复原本主题</span>
          </div>
        `, true)}

        ${themeAccordionBlock('主渐变色', `
          <div class="theme-row">
            <label>颜色 1</label>
            <input type="color" value="${t.primaryColor}" oninput="updateThemeColor('primaryColor', this.value)">
            <input type="text" value="${t.primaryColor}" onchange="updateThemeColor('primaryColor', this.value)">
          </div>

          <div class="theme-row">
            <label>颜色 2</label>
            <input type="color" value="${t.secondaryColor}" oninput="updateThemeColor('secondaryColor', this.value)">
            <input type="text" value="${t.secondaryColor}" onchange="updateThemeColor('secondaryColor', this.value)">
          </div>

          <div class="theme-row">
            <label>渐变角度</label>
            <input type="range" min="0" max="360" step="1" value="${t.gradientAngle}" oninput="updateThemeRange('gradientAngle', this.value, 'themeGradientAngleText', '°')">
            <span class="theme-opacity-value" id="themeGradientAngleText">${t.gradientAngle}°</span>
          </div>

          <div class="theme-help">按钮、标题栏、进度条、选中状态都会使用这个渐变。</div>
        `)}

        ${themeAccordionBlock('页面背景', `
          <div class="theme-row">
            <label>背景颜色</label>
            <input type="color" value="${t.pageBgColor}" oninput="updateThemeColor('pageBgColor', this.value)">
            <input type="text" value="${t.pageBgColor}" onchange="updateThemeColor('pageBgColor', this.value)">
          </div>

          <div class="theme-row">
            <label>不透明度</label>
            <input type="range" min="0" max="1" step="0.01" value="${t.pageBgOpacity}" oninput="updateThemeRange('pageBgOpacity', this.value, 'themePageOpacityText', '%')">
            <span class="theme-opacity-value" id="themePageOpacityText">${Math.round(t.pageBgOpacity * 100)}%</span>
          </div>

          <div class="theme-row">
            <label>背景图片</label>
            <div style="position:relative;display:inline-block;">
              <button class="btn-small">选择图片</button>
              <input type="file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" onchange="handleThemeBgUpload(event)">
            </div>
            <button class="btn-small" style="background:#f5f5f5;color:#888;" onclick="clearThemeBgImage()">清除图片</button>
          </div>
        `)}

        ${themeAccordionBlock('小卡片', `
          <div class="theme-row">
            <label>卡片颜色</label>
            <input type="color" value="${t.cardBgColor}" oninput="updateThemeColor('cardBgColor', this.value)">
            <input type="text" value="${t.cardBgColor}" onchange="updateThemeColor('cardBgColor', this.value)">
          </div>

          <div class="theme-row">
            <label>不透明度</label>
            <input type="range" min="0.1" max="1" step="0.01" value="${t.cardOpacity}" oninput="updateThemeRange('cardOpacity', this.value, 'themeCardOpacityText', '%')">
            <span class="theme-opacity-value" id="themeCardOpacityText">${Math.round(t.cardOpacity * 100)}%</span>
          </div>

          <div class="theme-row">
            <label>圆角</label>
            <input type="range" min="4" max="32" step="1" value="${t.radius}" oninput="updateThemeRange('radius', this.value, 'themeRadiusText', 'px')">
            <span class="theme-opacity-value" id="themeRadiusText">${t.radius}px</span>
          </div>

          <div class="theme-row">
            <label>阴影</label>
            <input type="range" min="0" max="0.35" step="0.01" value="${t.shadowOpacity}" oninput="updateThemeRange('shadowOpacity', this.value, 'themeShadowText', '%')">
            <span class="theme-opacity-value" id="themeShadowText">${Math.round(t.shadowOpacity * 100)}%</span>
          </div>
        `)}

        ${themeAccordionBlock('内部框 / 浅色块', `
          <div class="theme-row">
            <label>框颜色</label>
            <input type="color" value="${t.panelBgColor}" oninput="updateThemeColor('panelBgColor', this.value)">
            <input type="text" value="${t.panelBgColor}" onchange="updateThemeColor('panelBgColor', this.value)">
          </div>

          <div class="theme-row">
            <label>不透明度</label>
            <input type="range" min="0.1" max="1" step="0.01" value="${t.panelOpacity}" oninput="updateThemeRange('panelOpacity', this.value, 'themePanelOpacityText', '%')">
            <span class="theme-opacity-value" id="themePanelOpacityText">${Math.round(t.panelOpacity * 100)}%</span>
          </div>

          <div class="theme-help">余额小格子、预算分类框、统计框、上传框、设置小块都会受这里影响。</div>
        `)}

        ${themeAccordionBlock('输入框', `
          <div class="theme-row">
            <label>输入框色</label>
            <input type="color" value="${t.inputBgColor}" oninput="updateThemeColor('inputBgColor', this.value)">
            <input type="text" value="${t.inputBgColor}" onchange="updateThemeColor('inputBgColor', this.value)">
          </div>

          <div class="theme-row">
            <label>不透明度</label>
            <input type="range" min="0.1" max="1" step="0.01" value="${t.inputOpacity}" oninput="updateThemeRange('inputOpacity', this.value, 'themeInputOpacityText', '%')">
            <span class="theme-opacity-value" id="themeInputOpacityText">${Math.round(t.inputOpacity * 100)}%</span>
          </div>
        `)}

        ${themeAccordionBlock('文字颜色', `
          <div class="theme-row">
            <label>正文</label>
            <input type="color" value="${t.textColor}" oninput="updateThemeColor('textColor', this.value)">
            <input type="text" value="${t.textColor}" onchange="updateThemeColor('textColor', this.value)">
          </div>

          <div class="theme-row">
            <label>小字</label>
            <input type="color" value="${t.subTextColor}" oninput="updateThemeColor('subTextColor', this.value)">
            <input type="text" value="${t.subTextColor}" onchange="updateThemeColor('subTextColor', this.value)">
          </div>
        `)}

        ${themeAccordionBlock('主题预览', `
          <div class="theme-preview-box">
            <div class="theme-preview-header"></div>
            <div class="theme-preview-card">
              <div class="theme-preview-line"></div>
              <div class="theme-preview-line short"></div>
            </div>
          </div>
        `)}

        <div class="theme-fold-save-row">
          <button class="theme-reset-btn" onclick="resetCustomTheme()">恢复默认</button>
          <button class="theme-save-btn" onclick="saveCustomTheme()">保存主题</button>
        </div>

      </div>
    </div>
  `;
}

function themeAccordionBlock(title, body, open = false) {
  return `
    <div class="theme-accordion-block ${open ? 'open' : ''}">
      <div class="theme-accordion-head" onclick="this.parentElement.classList.toggle('open')">
        <span>${title}</span>
        <span class="theme-accordion-arrow">▼</span>
      </div>
      <div class="theme-accordion-body">
        ${body}
      </div>
    </div>
  `;
}

function toggleThemeFold() {
  const card = document.getElementById('themeFoldCard');
  if (!card) return;
  card.classList.toggle('fold-open');
}

/* --------------------------------
   2. 存钱目标分配修复
-------------------------------- */

// 打开添加储存资金时，自动插入“分配目标”下拉框
const patchOldOpenModal = window.openModal;
window.openModal = function(id) {
  if (typeof patchOldOpenModal === 'function') {
    patchOldOpenModal(id);
  }

  if (id === 'addSavingModal') {
    patchInjectSavingGoalSelect();
    patchRenderSavingGoalOptions();
  }

  if (id === 'addGoalModal') {
    const goalName = document.getElementById('goalName');
    const goalAmount = document.getElementById('goalAmount');
    if (goalName) goalName.value = '';
    if (goalAmount) goalAmount.value = '';
  }
};

function patchInjectSavingGoalSelect() {
  if (document.getElementById('savingGoalSelect')) return;

  const modal = document.querySelector('#addSavingModal .modal-content');
  const actions = document.querySelector('#addSavingModal .form-actions');
  if (!modal || !actions) return;

  const div = document.createElement('div');
  div.className = 'form-group';
  div.id = 'savingGoalSelectGroup';
  div.innerHTML = `
    <label>分配到存钱目标</label>
    <select id="savingGoalSelect">
      <option value="">不分配 / 放入未分配储存</option>
    </select>
    <div class="saving-goal-select-hint">
      选择后，这笔储存资金只会计入对应目标，不会同时占用多个目标进度。
    </div>
  `;

  modal.insertBefore(div, actions);
}

function patchRenderSavingGoalOptions() {
  const select = document.getElementById('savingGoalSelect');
  if (!select) return;

  const options = appData.savingGoals.map(goal => {
    return `<option value="${goal.id}">${goal.name}</option>`;
  }).join('');

  select.innerHTML = `
    <option value="">不分配 / 放入未分配储存</option>
    ${options}
  `;
}

// 覆盖保存储存资金
function saveSavingRecord() {
  patchEnsureAllDefaults();

  const amount = parseFloat(document.getElementById('savingAmount').value);
  const note = document.getElementById('savingNote').value.trim();
  const date = document.getElementById('savingDate').value;
  const goalSelect = document.getElementById('savingGoalSelect');
  const goalId = goalSelect ? goalSelect.value : '';

  if (!amount || amount <= 0) {
    alert('请输入有效金额');
    return;
  }

  if (!date) {
    alert('请选择日期');
    return;
  }

  appData.savings.push({
    amount,
    note: note || '储存',
    date,
    id: Date.now() + Math.random(),
    goalId: goalId || '',
  });

  saveData();
  closeModal('addSavingModal');

  document.getElementById('savingAmount').value = '';
  document.getElementById('savingNote').value = '';
  if (goalSelect) goalSelect.value = '';

  renderAll();
}

// 覆盖存钱目标渲染：每个目标只统计自己被分配到的钱
function renderSavingGoals() {
  patchEnsureAllDefaults();

  const list = document.getElementById('savingGoalList');

  if (!list) return;

  if (appData.savingGoals.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:20px 0;">暂无存钱目标</div>';
    return;
  }

  list.innerHTML = appData.savingGoals.map((goal, idx) => {
    const goalSaved = appData.savings
      .filter(sv => String(sv.goalId || '') === String(goal.id))
      .reduce((s, sv) => s + (Number(sv.amount) || 0), 0);

    const target = Number(goal.amount) || 1;
    const percent = Math.min(100, goalSaved / target * 100);
    const left = Math.max(0, target - goalSaved);

    return `
      <div class="saving-goal-card">
        <div class="goal-header">
          <span class="goal-name">🎯 ${goal.name}</span>
          <span>
            <span class="goal-amount">${formatMoney(goalSaved)} / ${formatMoney(target)}</span>
            <button class="goal-del" onclick="deleteSavingGoal(${idx})">×</button>
          </span>
        </div>

        <div class="goal-progress-bar-bg">
          <div class="goal-progress-bar-fill" style="width:${percent}%"></div>
        </div>

        <div class="goal-percent">${percent.toFixed(1)}%</div>

        <div class="goal-extra">
          <span>已分配 ${formatMoney(goalSaved)}</span>
          <span class="goal-left-money">还差 ${formatMoney(left)}</span>
        </div>
      </div>
    `;
  }).join('');

  patchRenderSavingGoalOptions();
}

// 覆盖储存记录渲染：显示分配给哪个目标
function renderSavingRecords() {
  patchEnsureAllDefaults();

  const list = document.getElementById('savingRecordList');

  if (!list) return;

  if (appData.savings.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:12px 0;">暂无储存记录</div>';
    return;
  }

  list.innerHTML = appData.savings.map((sv, idx) => {
    const goal = appData.savingGoals.find(g => String(g.id) === String(sv.goalId || ''));
    const goalText = goal ? `🎯 ${goal.name}` : '未分配';

    return `
      <div class="saving-record">
        <div class="info">
          <div class="note">${sv.note || '储存'}</div>
          <div class="date">${sv.date}</div>
          <div class="saving-record-goal">${goalText}</div>
        </div>
        <div class="amount">+${formatMoney(sv.amount)}</div>
        <button class="del-btn" onclick="deleteSaving(${idx})">×</button>
      </div>
    `;
  }).join('');
}

// 覆盖删除目标：已分配到该目标的钱改成未分配
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

/* --------------------------------
   3. API 设置增强
-------------------------------- */

// 覆盖 API 设置页渲染
function populateApiSettings() {
  patchEnsureAllDefaults();

  const ai = appData.aiSettings;
  const pages = document.querySelectorAll('.api-card-page');
  const apiPage = pages[0];

  if (apiPage) {
    const modelsText = (ai.apiAvailableModels || []).join('\n');
    const modelOptions = (ai.apiAvailableModels || []).map(m => `
      <option value="${escapePatchAttr(m)}" ${m === ai.apiModel ? 'selected' : ''}>${escapePatchHtml(m)}</option>
    `).join('');

    const status = ai.apiConnectionStatus || { ok: false, message: '未测试' };
    const statusClass = status.ok ? 'success' : (status.message === '未测试' ? '' : 'error');
    const statusIcon = status.ok ? '✅' : (status.message === '未测试' ? '○' : '❌');

    apiPage.innerHTML = `
      <div class="api-advanced-grid">

        <div class="form-group">
          <label>API 基础地址</label>
          <input type="text" id="apiBaseUrl" placeholder="例如：https://api.openai.com 或 https://你的后端.com" value="${escapePatchAttr(ai.apiBaseUrl || '')}">
          <div class="api-mini-help">
            如果你有后端代理，填后端地址。纯前端测试时可以填服务商 API 地址。
          </div>
        </div>

        <div class="form-group">
          <label>自定义密钥</label>
          <input type="password" id="apiKey" placeholder="sk-... 或你的后端 token" value="${escapePatchAttr(ai.apiKey || '')}">
          <div class="api-mini-help">
            注意：纯前端保存密钥会存在浏览器 localStorage，只适合个人本地使用。正式上线建议放后端。
          </div>
        </div>

        <div class="form-group">
          <label>聊天端点</label>
          <input type="text" id="apiChatEndpoint" placeholder="/v1/chat/completions 或 /api/ai/chat" value="${escapePatchAttr(ai.apiChatEndpoint || '/api/ai/chat')}">
        </div>

        <div class="form-group">
          <label>文字记账端点</label>
          <input type="text" id="apiParseEndpoint" placeholder="/api/ai/parse-expense" value="${escapePatchAttr(ai.apiParseEndpoint || '/api/ai/parse-expense')}">
        </div>

        <div class="form-group">
          <label>图片识别端点</label>
          <input type="text" id="apiReceiptEndpoint" placeholder="/api/ai/recognize-receipt" value="${escapePatchAttr(ai.apiReceiptEndpoint || '/api/ai/recognize-receipt')}">
        </div>

        <div class="form-group">
          <label>模型名</label>
          <div class="api-model-row">
            <input type="text" id="apiModel" placeholder="例如：gpt-4o-mini" value="${escapePatchAttr(ai.apiModel || '')}">
            <select id="apiModelSelect" onchange="patchChooseApiModel(this.value)">
              <option value="">选择模型</option>
              ${modelOptions}
            </select>
          </div>
          <div class="api-mini-help">
            从右侧选择模型后，会自动填入左侧模型名。
          </div>
        </div>

        <div class="form-group">
          <label>可用模型</label>
          <textarea class="api-models-textarea" id="apiAvailableModelsText" placeholder="每行一个模型名">${escapePatchTextarea(modelsText)}</textarea>
          <div class="api-mini-help">
            每行一个模型。保存后会出现在模型下拉框。
          </div>
        </div>

        <div>
          <span class="api-status-pill ${statusClass}" id="apiConnectionStatus">
            ${statusIcon} ${escapePatchHtml(status.message || '未测试')}
          </span>
        </div>

        <div class="api-actions-row">
          <button class="api-test-btn" onclick="testApiConnection()">测试连接</button>
          <button class="api-save-btn" onclick="saveApiSettings()">保存 API 设置</button>
        </div>

      </div>
    `;
  }

  // 原来的 AI 人设页继续填充
  const persona = ai.persona || {};
  const personaName = document.getElementById('personaName');
  const personaCallUser = document.getElementById('personaCallUser');
  const personaText = document.getElementById('personaText');
  const avatarEl = document.getElementById('personaAvatarPreview');

  if (personaName) personaName.value = persona.name || '小金';
  if (personaCallUser) personaCallUser.value = persona.callUser || '主人';
  if (personaText) personaText.value = persona.personality || '';

  if (avatarEl) {
    if (persona.avatar) {
      avatarEl.innerHTML = `<img src="${persona.avatar}" alt="人设头像"><input type="file" accept="image/*" onchange="handlePersonaAvatar(event)">`;
    } else {
      avatarEl.innerHTML = `🤖<input type="file" accept="image/*" onchange="handlePersonaAvatar(event)">`;
    }
  }

  if (typeof renderStickerLibrary === 'function') {
    renderStickerLibrary();
  }
}

function patchChooseApiModel(model) {
  const input = document.getElementById('apiModel');
  if (input && model) input.value = model;
}

function saveApiSettings() {
  patchEnsureAllDefaults();

  const ai = appData.aiSettings;

  const baseUrl = document.getElementById('apiBaseUrl');
  const key = document.getElementById('apiKey');
  const model = document.getElementById('apiModel');
  const chatEndpoint = document.getElementById('apiChatEndpoint');
  const parseEndpoint = document.getElementById('apiParseEndpoint');
  const receiptEndpoint = document.getElementById('apiReceiptEndpoint');
  const modelsText = document.getElementById('apiAvailableModelsText');

  if (baseUrl) ai.apiBaseUrl = baseUrl.value.trim();
  if (key) ai.apiKey = key.value.trim();
  if (model) ai.apiModel = model.value.trim() || 'gpt-4o';
  if (chatEndpoint) ai.apiChatEndpoint = chatEndpoint.value.trim() || '/api/ai/chat';
  if (parseEndpoint) ai.apiParseEndpoint = parseEndpoint.value.trim() || '/api/ai/parse-expense';
  if (receiptEndpoint) ai.apiReceiptEndpoint = receiptEndpoint.value.trim() || '/api/ai/recognize-receipt';

  if (modelsText) {
    ai.apiAvailableModels = modelsText.value
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean);
  }

  // 人设字段
  const personaName = document.getElementById('personaName');
  const personaCallUser = document.getElementById('personaCallUser');
  const personaText = document.getElementById('personaText');

  if (!ai.persona) ai.persona = {};
  if (personaName) ai.persona.name = personaName.value.trim() || '小金';
  if (personaCallUser) ai.persona.callUser = personaCallUser.value.trim() || '主人';
  if (personaText) ai.persona.personality = personaText.value.trim();

  saveData();

  if (typeof renderChatHeader === 'function') renderChatHeader();

  alert('✅ API 设置已保存');
  populateApiSettings();
}

function patchBuildApiUrl(endpoint) {
  const base = (appData.aiSettings.apiBaseUrl || '').trim();
  const ep = (endpoint || '').trim();

  // 如果端点本身就是完整地址
  if (/^https?:\/\//i.test(ep)) return ep;

  // 如果没填基础地址，则走本地相对路径
  if (!base) return ep || '/api/ai/chat';

  return base.replace(/\/$/, '') + '/' + ep.replace(/^\//, '');
}

// 测试连接：默认按 OpenAI-compatible chat/completions 测试。
// 如果你的后端不是这个格式，也可以让后端兼容这个测试 payload。
async function testApiConnection() {
  patchEnsureAllDefaults();
  saveApiSettingsWithoutAlert();

  const statusEl = document.getElementById('apiConnectionStatus');
  if (statusEl) {
    statusEl.className = 'api-status-pill testing';
    statusEl.textContent = '⏳ 测试中...';
  }

  const ai = appData.aiSettings;
  const url = patchBuildApiUrl(ai.apiChatEndpoint);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (ai.apiKey) {
      headers.Authorization = `Bearer ${ai.apiKey}`;
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: ai.apiModel || 'gpt-4o',
        messages: [
          { role: 'user', content: '请回复：连接成功' }
        ],
        temperature: 0.2,
        max_tokens: 20,
        test: true,
      })
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    appData.aiSettings.apiConnectionStatus = {
      ok: true,
      message: '连接成功',
      testedAt: new Date().toLocaleString(),
    };

    saveData();

    if (statusEl) {
      statusEl.className = 'api-status-pill success';
      statusEl.textContent = '✅ 连接成功';
    }

  } catch (err) {
    appData.aiSettings.apiConnectionStatus = {
      ok: false,
      message: '连接失败：' + err.message,
      testedAt: new Date().toLocaleString(),
    };

    saveData();

    if (statusEl) {
      statusEl.className = 'api-status-pill error';
      statusEl.textContent = '❌ 连接失败：' + err.message;
    }
  }
}

function saveApiSettingsWithoutAlert() {
  const ai = appData.aiSettings;

  const baseUrl = document.getElementById('apiBaseUrl');
  const key = document.getElementById('apiKey');
  const model = document.getElementById('apiModel');
  const chatEndpoint = document.getElementById('apiChatEndpoint');
  const parseEndpoint = document.getElementById('apiParseEndpoint');
  const receiptEndpoint = document.getElementById('apiReceiptEndpoint');
  const modelsText = document.getElementById('apiAvailableModelsText');

  if (baseUrl) ai.apiBaseUrl = baseUrl.value.trim();
  if (key) ai.apiKey = key.value.trim();
  if (model) ai.apiModel = model.value.trim() || 'gpt-4o';
  if (chatEndpoint) ai.apiChatEndpoint = chatEndpoint.value.trim() || '/api/ai/chat';
  if (parseEndpoint) ai.apiParseEndpoint = parseEndpoint.value.trim() || '/api/ai/parse-expense';
  if (receiptEndpoint) ai.apiReceiptEndpoint = receiptEndpoint.value.trim() || '/api/ai/recognize-receipt';

  if (modelsText) {
    ai.apiAvailableModels = modelsText.value
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean);
  }

  saveData();
}

/* --------------------------------
   4. 让 AI 调用使用自定义端点和密钥
-------------------------------- */

function patchAiHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  const key = appData.aiSettings && appData.aiSettings.apiKey;
  if (key) headers.Authorization = `Bearer ${key}`;

  return headers;
}

// 覆盖 AI 聊天记账
async function sendAiChatBill() {
  patchEnsureAllDefaults();

  const textarea = document.getElementById('aiChatBillInput');
  const text = textarea.value.trim();

  if (!text) return;

  textarea.value = '';
  textarea.style.height = '52px';

  const btn = document.getElementById('aiChatBillSendBtn');
  if (btn) btn.disabled = true;

  try {
    const url = patchBuildApiUrl(appData.aiSettings.apiParseEndpoint);

    const resp = await fetch(url, {
      method: 'POST',
      headers: patchAiHeaders(),
      body: JSON.stringify({
        model: appData.aiSettings.apiModel,
        text,
        categories: appData.budgetCategories.map(c => ({
          name: c.name,
          subs: (c.subs || []).map(s => s.name),
        })),
        persona: appData.aiSettings.persona,
      })
    });

    if (!resp.ok) throw new Error(`解析失败 HTTP ${resp.status}`);

    const data = await resp.json();

    const items = data.items || [];
    const replies = data.replies || [];

    if (items.length > 0) {
      renderAiParsedItems(items, text);
    }

    if (typeof appendChatMessage === 'function') {
      appendChatMessage('user', text);
      replies.forEach(r => appendChatMessage('ai', r));
    }

    pendingChatBillItems = items;

  } catch (err) {
    alert('解析出错：' + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* --------------------------------
   5. 工具函数
-------------------------------- */

function escapePatchHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapePatchAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapePatchTextarea(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* --------------------------------
   6. 初始化
-------------------------------- */

document.addEventListener('DOMContentLoaded', function() {
  patchEnsureAllDefaults();

  if (typeof applyCustomTheme === 'function') {
    applyCustomTheme();
  }

  renderThemeCustomizePanel();

  // 重新渲染，保证存钱目标进度按分配计算
  if (typeof renderAll === 'function') {
    renderAll();
  }
});
/* =========================================================
   补丁：聊天框发图片 / 聊天框用表情包 / 表情包备注
========================================================= */

/* --------------------------------
   A. 表情包数据迁移：从字符串升级为对象
-------------------------------- */

function patchNormalizeStickers() {
  if (!appData.aiSettings) appData.aiSettings = {};
  if (!Array.isArray(appData.aiSettings.stickers)) appData.aiSettings.stickers = [];

  appData.aiSettings.stickers = appData.aiSettings.stickers.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: Date.now() + index + Math.random(),
        src: item,
        note: '',
      };
    }

    return {
      id: item.id || Date.now() + index + Math.random(),
      src: item.src || item.url || '',
      note: item.note || '',
    };
  }).filter(item => item.src);

  saveData();
}

/* --------------------------------
   B. 覆盖表情包库：增加备注
-------------------------------- */

function renderStickerLibrary() {
  patchNormalizeStickers();

  const lib = document.getElementById('stickerLibrary');
  if (!lib) return;

  const stickers = appData.aiSettings.stickers || [];

  lib.innerHTML = stickers.map((item, i) => `
    <div class="sticker-thumb-wrap">
      <div class="sticker-thumb">
        <img src="${item.src}" alt="sticker${i}">
        <button class="sticker-del" onclick="deleteSticker(${i})">×</button>
      </div>
      <input
        class="sticker-note-input"
        type="text"
        value="${escapePatchAttr(item.note || '')}"
        placeholder="备注"
        onchange="saveStickerNote(${i}, this.value)"
      >
    </div>
  `).join('') + `
    <div class="sticker-upload-btn">
      ➕<span>上传</span>
      <input type="file" accept="image/*" multiple onchange="handleStickerUpload(event)">
    </div>
  `;
}

function handleStickerUpload(e) {
  patchNormalizeStickers();

  const files = Array.from(e.target.files);
  if (!files.length) return;

  let loaded = 0;

  files.forEach(file => {
    const reader = new FileReader();

    reader.onload = ev => {
      appData.aiSettings.stickers.push({
        id: Date.now() + Math.random(),
        src: ev.target.result,
        note: file.name ? file.name.replace(/\.[^.]+$/, '') : '',
      });

      loaded++;

      if (loaded === files.length) {
        saveData();
        renderStickerLibrary();
      }
    };

    reader.readAsDataURL(file);
  });

  e.target.value = '';
}

function saveStickerNote(idx, note) {
  patchNormalizeStickers();

  if (!appData.aiSettings.stickers[idx]) return;

  appData.aiSettings.stickers[idx].note = note.trim();
  saveData();
}

function deleteSticker(idx) {
  patchNormalizeStickers();

  appData.aiSettings.stickers.splice(idx, 1);
  saveData();
  renderStickerLibrary();
}

function getRandomSticker() {
  patchNormalizeStickers();

  const stickers = appData.aiSettings.stickers || [];
  if (stickers.length === 0) return null;

  const item = stickers[Math.floor(Math.random() * stickers.length)];
  return item.src;
}

/* --------------------------------
   C. 给聊天输入栏注入图片按钮和表情包按钮
-------------------------------- */

function patchInjectChatMediaButtons() {
  const bar = document.querySelector('.chat-input-bar');
  const textarea = document.getElementById('chatInputTextarea');

  if (!bar || !textarea) return;
  if (document.getElementById('chatImageBtn')) return;

  const imageBtn = document.createElement('button');
  imageBtn.className = 'chat-media-btn';
  imageBtn.id = 'chatImageBtn';
  imageBtn.type = 'button';
  imageBtn.innerHTML = '🖼';
  imageBtn.title = '发送图片';
  imageBtn.onclick = function() {
    document.getElementById('chatImageInput').click();
  };

  const stickerBtn = document.createElement('button');
  stickerBtn.className = 'chat-media-btn';
  stickerBtn.id = 'chatStickerBtn';
  stickerBtn.type = 'button';
  stickerBtn.innerHTML = '😺';
  stickerBtn.title = '发送表情包';
  stickerBtn.onclick = openStickerPicker;

  const imageInput = document.createElement('input');
  imageInput.type = 'file';
  imageInput.id = 'chatImageInput';
  imageInput.accept = 'image/*';
  imageInput.multiple = true;
  imageInput.style.display = 'none';
  imageInput.onchange = handleChatImageUpload;

  bar.insertBefore(imageBtn, textarea);
  bar.insertBefore(stickerBtn, textarea);
  bar.appendChild(imageInput);
}

/* --------------------------------
   D. 聊天框发图片，然后 AI 分析提取
-------------------------------- */

function handleChatImageUpload(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  const images = [];
  let loaded = 0;

  files.forEach(file => {
    const reader = new FileReader();

    reader.onload = ev => {
      const dataUrl = ev.target.result;
      images.push(dataUrl);

      // 先把用户发出的图片显示到聊天里
      appendChatMessage('user', dataUrl, 'image');

      loaded++;

      if (loaded === files.length) {
        analyzeChatImages(images);
      }
    };

    reader.readAsDataURL(file);
  });

  e.target.value = '';
}

async function analyzeChatImages(images) {
  patchEnsureAllDefaults();

  const analyzingId = 'chatImageAnalyzing_' + Date.now();
  patchShowImageAnalyzing(analyzingId);

  try {
    const url = patchBuildApiUrl(appData.aiSettings.apiReceiptEndpoint);
    const stickerNotes = getStickerNoteOptions();

    const resp = await fetch(url, {
      method: 'POST',
      headers: patchAiHeaders(),
      body: JSON.stringify({
        model: appData.aiSettings.apiModel,
        images,
        source: 'chat-image',
        stickerNotes,
        instruction:
          '请分析用户在聊天框发送的图片，提取其中可能存在的消费账单、订单、票据、截图付款信息。' +
          '请返回 JSON：{ replies: string[], items: array, stickerNotes?: string[] }。' +
          '如果需要发送表情包，只能从 stickerNotes 里选择备注名称，不要识别表情包图片内容。'
      })
    });

    if (!resp.ok) {
      throw new Error(`图片分析失败 HTTP ${resp.status}`);
    }

    const data = await resp.json();

    patchRemoveImageAnalyzing(analyzingId);

    const replies = data.replies && data.replies.length
      ? data.replies
      : ['我看完图片啦，帮你整理出可能的账单信息～'];

    const items = data.items || [];

    if (items.length > 0) {
      replies.forEach((reply, i) => {
        if (i === replies.length - 1) {
          appendChatMessage('ai', reply, 'bill', items.map((item, idx) => ({
            id: Date.now() + idx + Math.random(),
            amount: item.amount || 0,
            category: item.category || '',
            subCategory: item.subCategory || '',
            note: item.note || '聊天图片识别',
            date: item.date || todayStr(),
          })));
        } else {
          appendChatMessage('ai', reply);
        }
      });
    } else {
      replies.forEach(reply => appendChatMessage('ai', reply));
      appendChatMessage('ai', '这张图片里我暂时没有提取到明确账单，你也可以换一张更清晰的试试～');
    }

    // 重点：按 AI 返回的备注发送表情包
    let selectedStickerNotes = getStickerNotesFromAiResponse(data);

    // 如果后端还没返回 stickerNotes，就根据回复文字本地猜一个
    if (selectedStickerNotes.length === 0) {
      const guessed = guessStickerNoteFromReplies(replies);
      if (guessed) selectedStickerNotes = [guessed];
    }

    appendAiStickersByNotes(selectedStickerNotes);

  } catch (err) {
    patchRemoveImageAnalyzing(analyzingId);
    appendChatMessage('ai', '图片分析失败啦：' + err.message + ' 🥺');

    // 失败时也可以按备注找一个“失败/哭哭/难过”类表情包
    const fallback = findStickerByNote('哭哭') || findStickerByNote('难过') || findStickerByNote('失败');
    if (fallback) {
      setTimeout(() => appendChatMessage('ai', fallback, 'sticker'), 400);
    }
  }
}

/* --------------------------------
   E. 表情包选择器：按备注搜索
-------------------------------- */

function openStickerPicker() {
  patchNormalizeStickers();
  patchEnsureStickerPicker();

  const overlay = document.getElementById('stickerPickerOverlay');
  if (!overlay) return;

  renderStickerPickerList('');
  overlay.classList.add('show');
}

function closeStickerPicker() {
  const overlay = document.getElementById('stickerPickerOverlay');
  if (overlay) overlay.classList.remove('show');
}

function patchEnsureStickerPicker() {
  if (document.getElementById('stickerPickerOverlay')) return;

  const div = document.createElement('div');
  div.className = 'sticker-picker-overlay';
  div.id = 'stickerPickerOverlay';

  div.innerHTML = `
    <div class="sticker-picker-panel">
      <div class="sticker-picker-title">
        <span>选择表情包</span>
        <button onclick="closeStickerPicker()">×</button>
      </div>

      <input
        class="sticker-search-input"
        id="stickerSearchInput"
        type="text"
        placeholder="按备注搜索，比如：开心、生气、猫猫"
        oninput="renderStickerPickerList(this.value)"
      >

      <div class="sticker-picker-grid" id="stickerPickerGrid"></div>
    </div>
  `;

  div.addEventListener('click', function(e) {
    if (e.target === div) closeStickerPicker();
  });

  document.body.appendChild(div);
}

function renderStickerPickerList(keyword) {
  patchNormalizeStickers();

  const grid = document.getElementById('stickerPickerGrid');
  if (!grid) return;

  const kw = String(keyword || '').trim().toLowerCase();
  const stickers = appData.aiSettings.stickers || [];

  const filtered = stickers.filter(item => {
    const note = String(item.note || '').toLowerCase();
    return !kw || note.includes(kw);
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:#888;font-size:13px;padding:20px 0;">
        没找到表情包，先去 AI 设置 → 表情包库 上传并备注吧～
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="sticker-picker-item" onclick="sendUserSticker('${item.id}')">
      <img src="${item.src}" alt="${escapePatchAttr(item.note || '表情包')}">
      <div class="sticker-picker-note">${escapePatchHtml(item.note || '未备注')}</div>
    </div>
  `).join('');
}

function sendUserSticker(stickerId) {
  patchNormalizeStickers();

  const item = appData.aiSettings.stickers.find(s => String(s.id) === String(stickerId));

  if (!item || !item.src) {
    alert('这个表情包图片失效了，可以重新上传一次。');
    return;
  }

  appendChatMessage('user', item.src, 'sticker');
  closeStickerPicker();
}

/* --------------------------------
   F. 覆盖聊天消息渲染：支持用户图片 / 用户表情包
-------------------------------- */

function renderChatMessages() {
  if (typeof ensureChatCustomizeDefaults === 'function') {
    ensureChatCustomizeDefaults();
  }

  const list = document.getElementById('chatMessageList');
  if (!list) return;

  const cc = appData.aiSettings.chatCustomize || {};
  const baseStyle = typeof getBubbleBaseStyle === 'function'
    ? getBubbleBaseStyle()
    : `font-size:${cc.bubbleFontSize || 14}px;`;

  list.innerHTML = chatMessages.map((msg, idx) => {
    if (msg.role === 'user') {
      if (msg.type === 'image') {
        return `
          <div class="chat-msg-user">
            <div class="msg-image">
              <img src="${msg.content}" alt="用户图片">
            </div>
          </div>
        `;
      }

      if (msg.type === 'sticker') {
        return `
          <div class="chat-msg-user">
            <div class="msg-sticker">
              <img src="${msg.content}" alt="用户表情包">
            </div>
          </div>
        `;
      }

      return `
        <div class="chat-msg-user">
          <div class="msg-bubble" style="${baseStyle};${sanitizePatchCss(cc.userBubbleCss || '')}">
            ${escapePatchHtml(msg.content)}
          </div>
        </div>
      `;
    }

    const persona = appData.aiSettings.persona || {};
    const avatarHtml = persona.avatar
      ? `<div class="msg-avatar"><img src="${persona.avatar}" alt="AI"></div>`
      : `<div class="msg-avatar">🤖</div>`;

    if (msg.type === 'image') {
      return `
        <div class="chat-msg-ai">
          ${avatarHtml}
          <div class="msg-bubble-wrap">
            <div class="msg-image">
              <img src="${msg.content}" alt="AI图片">
            </div>
          </div>
        </div>
      `;
    }

    if (msg.type === 'sticker') {
      return `
        <div class="chat-msg-ai">
          ${avatarHtml}
          <div class="msg-bubble-wrap">
            <div class="msg-sticker">
              <img src="${msg.content}" alt="AI表情包">
            </div>
          </div>
        </div>
      `;
    }

    if (msg.type === 'bill' && msg.items && msg.items.length > 0) {
      return `
        <div class="chat-msg-ai">
          ${avatarHtml}
          <div class="msg-bubble-wrap">
            <div class="msg-bubble" style="${baseStyle};${sanitizePatchCss(cc.aiBubbleCss || '')}">
              ${escapePatchHtml(msg.content)}
            </div>
            ${renderInlineBillCards(msg.items, idx)}
          </div>
        </div>
      `;
    }

    return `
      <div class="chat-msg-ai">
        ${avatarHtml}
        <div class="msg-bubble-wrap">
          <div class="msg-bubble" style="${baseStyle};${sanitizePatchCss(cc.aiBubbleCss || '')}">
            ${escapePatchHtml(msg.content)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function sanitizePatchCss(css) {
  return String(css || '')
    .replace(/<style[\s\S]*?>/gi, '')
    .replace(/<\/style>/gi, '')
    .replace(/<script[\s\S]*?>/gi, '')
    .replace(/<\/script>/gi, '')
    .trim();
}

/* --------------------------------
   G. 初始化
-------------------------------- */

document.addEventListener('DOMContentLoaded', function() {
  patchNormalizeStickers();

  setTimeout(function() {
    patchInjectChatMediaButtons();
    patchEnsureStickerPicker();
    if (typeof renderStickerLibrary === 'function') renderStickerLibrary();
  }, 200);
});

// 如果切到对话框页，也补一次按钮
const patchOldSwitchPageForMedia = window.switchPage;
window.switchPage = function(pageId, btn) {
  if (typeof patchOldSwitchPageForMedia === 'function') {
    patchOldSwitchPageForMedia(pageId, btn);
  }

  if (pageId === 'pageChat') {
    setTimeout(function() {
      patchInjectChatMediaButtons();
      patchEnsureStickerPicker();
    }, 50);
  }
};
/* =========================================================
   补丁：AI 按表情包备注选择表情包
   逻辑：AI 不识别表情包图片，只读取备注并返回 stickerNote
========================================================= */

/* 获取表情包备注列表，发给 AI 作为可选项 */
function getStickerNoteOptions() {
  patchNormalizeStickers();

  return (appData.aiSettings.stickers || [])
    .map(item => item.note || '')
    .map(note => note.trim())
    .filter(Boolean);
}

/* 根据备注精确/模糊找表情包 */
function findStickerByNote(note) {
  patchNormalizeStickers();

  const target = String(note || '').trim().toLowerCase();
  if (!target) return null;

  const stickers = appData.aiSettings.stickers || [];

  // 先精确匹配
  let found = stickers.find(item =>
    String(item.note || '').trim().toLowerCase() === target
  );

  if (found) return found.src;

  // 再模糊匹配：备注包含关键词，或关键词包含备注
  found = stickers.find(item => {
    const n = String(item.note || '').trim().toLowerCase();
    return n && (n.includes(target) || target.includes(n));
  });

  return found ? found.src : null;
}

/* 从 AI 返回内容中取表情包备注 */
function getStickerNotesFromAiResponse(data) {
  if (!data) return [];

  // 推荐后端返回 stickerNotes: ['开心', '鼓掌']
  if (Array.isArray(data.stickerNotes)) {
    return data.stickerNotes.map(x => String(x).trim()).filter(Boolean);
  }

  // 也兼容 stickerNote: '开心'
  if (data.stickerNote) {
    return [String(data.stickerNote).trim()].filter(Boolean);
  }

  // 也兼容 stickers: ['开心']
  if (Array.isArray(data.stickers)) {
    return data.stickers.map(x => String(x).trim()).filter(Boolean);
  }

  return [];
}

/* 按备注发送 AI 表情包 */
function appendAiStickersByNotes(notes) {
  const arr = Array.isArray(notes) ? notes : [notes];

  arr.forEach((note, index) => {
    const stickerSrc = findStickerByNote(note);
    if (stickerSrc) {
      setTimeout(() => {
        appendChatMessage('ai', stickerSrc, 'sticker');
      }, 350 + index * 260);
    }
  });
}

/* 根据 AI 回复文本自动猜一个表情包备注，作为后备方案 */
function guessStickerNoteFromReplies(replies) {
  const text = (replies || []).join(' ');

  const rules = [
    { keys: ['成功', '记好了', '完成', '太棒', '真棒', '不错', '好耶'], notes: ['开心', '鼓掌', '好耶', '棒'] },
    { keys: ['失败', '出错', '问题', '不行', '没有识别', '没识别'], notes: ['哭哭', '难过', '震惊'] },
    { keys: ['省钱', '存起来', '预算', '余额'], notes: ['存钱', '钱包', '认真'] },
    { keys: ['买', '花了', '消费', '支出'], notes: ['花钱', '震惊', '钱包'] },
    { keys: ['提醒', '小心', '超支'], notes: ['警告', '震惊', '生气'] },
  ];

  const availableNotes = getStickerNoteOptions();
  if (availableNotes.length === 0) return '';

  for (const rule of rules) {
    const hit = rule.keys.some(k => text.includes(k));
    if (!hit) continue;

    const matched = rule.notes.find(note =>
      availableNotes.some(n => n.includes(note) || note.includes(n))
    );

    if (matched) {
      const real = availableNotes.find(n => n.includes(matched) || matched.includes(n));
      return real || matched;
    }
  }

  return '';
}
function patchShowImageAnalyzing(id) {
  const list = document.getElementById('chatMessageList');
  if (!list) return;

  const div = document.createElement('div');
  div.id = id;
  div.className = 'chat-image-analyzing';
  div.textContent = 'AI 正在分析图片中...';

  list.appendChild(div);
  window.scrollTo(0, document.body.scrollHeight);
}

function patchRemoveImageAnalyzing(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
/* =========================================================
   聊天历史 / 单独导出 / 删除 / 时间戳 / 回复模式 / AI回复设置
========================================================= */

const CHAT_HISTORY_KEY = 'myPiggyBankChatHistory';

function ensureChatAdvancedSettings() {
  if (!appData.aiSettings) appData.aiSettings = {};
  if (!appData.aiSettings.chatAdvanced) {
    appData.aiSettings.chatAdvanced = {
      replyMode: 'instant',
      maxReplyChars: 80,
      minReplies: 1,
      maxReplies: 3,
      stickerMode: 'random',
      timestampFormat: 'YYYY-MM-DD HH:mm',
      timestampCss: '',
    };
  }

  const def = {
    replyMode: 'instant',
    maxReplyChars: 80,
    minReplies: 1,
    maxReplies: 3,
    stickerMode: 'random',
    timestampFormat: 'YYYY-MM-DD HH:mm',
    timestampCss: '',
  };

  for (const k in def) {
    if (appData.aiSettings.chatAdvanced[k] === undefined) {
      appData.aiSettings.chatAdvanced[k] = def[k];
    }
  }

  saveData();
}

function loadChatHistory() {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    chatMessages = raw ? JSON.parse(raw) : [];
  } catch (e) {
    chatMessages = [];
  }
}

function saveChatHistory() {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatMessages || []));
}

function exportChatHistory() {
  ensureChatAdvancedSettings();

  const data = {
    exportedAt: new Date().toISOString(),
    app: 'my-piggy-bank',
    type: 'chat-history',
    persona: appData.aiSettings.persona || {},
    chatAdvanced: appData.aiSettings.chatAdvanced || {},
    messages: chatMessages || [],
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = `小金库聊天记录_${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearChatHistory() {
  if (!confirm('确定清空全部聊天记录吗？')) return;
  chatMessages = [];
  saveChatHistory();
  renderChatMessages();
}

function deleteChatMessage(idx) {
  if (!confirm('删除这条聊天内容吗？')) return;
  chatMessages.splice(idx, 1);
  saveChatHistory();
  renderChatMessages();
}

function formatChatTime(ts) {
  ensureChatAdvancedSettings();

  const d = new Date(ts || Date.now());
  const fmt = appData.aiSettings.chatAdvanced.timestampFormat || 'YYYY-MM-DD HH:mm';

  const pad = n => String(n).padStart(2, '0');

  const map = {
    YYYY: d.getFullYear(),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  };

  if (fmt === '今天 HH:mm') {
    const now = new Date();
    const sameDay =
      now.getFullYear() === d.getFullYear() &&
      now.getMonth() === d.getMonth() &&
      now.getDate() === d.getDate();

    return (sameDay ? '今天 ' : `${map.MM}-${map.DD} `) + `${map.HH}:${map.mm}`;
  }

  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, key => map[key]);
}

function getChatTimestampHtml(msg, idx) {
  ensureChatAdvancedSettings();

  const css = sanitizePatchCss(appData.aiSettings.chatAdvanced.timestampCss || '');

  return `
    <div class="chat-message-actions">
      <span class="chat-time-label" style="${css}">${formatChatTime(msg.time)}</span>
      <button class="chat-delete-btn" onclick="deleteChatMessage(${idx})">删除</button>
    </div>
  `;
}

function appendChatMessage(role, content, type = 'text', items = null) {
  const msg = {
    id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 99999),
    role,
    type,
    content,
    items,
    time: Date.now(),
  };

  chatMessages.push(msg);
  saveChatHistory();
  renderChatMessages();

  setTimeout(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, 50);
}

function renderChatMessages() {
  if (typeof ensureChatCustomizeDefaults === 'function') {
    ensureChatCustomizeDefaults();
  }
  ensureChatAdvancedSettings();

  const list = document.getElementById('chatMessageList');
  if (!list) return;

  const cc = appData.aiSettings.chatCustomize || {};
  const baseStyle = typeof getBubbleBaseStyle === 'function'
    ? getBubbleBaseStyle()
    : `font-size:${cc.bubbleFontSize || 14}px;`;

  list.innerHTML = chatMessages.map((msg, idx) => {
    if (msg.role === 'user') {
      if (msg.type === 'image') {
        return `
          <div class="chat-msg-user">
            <div>
              <div class="msg-image"><img src="${msg.content}" alt="用户图片"></div>
              ${getChatTimestampHtml(msg, idx)}
            </div>
          </div>
        `;
      }

      if (msg.type === 'sticker') {
        return `
          <div class="chat-msg-user">
            <div>
              <div class="msg-sticker"><img src="${msg.content}" alt="用户表情包"></div>
              ${getChatTimestampHtml(msg, idx)}
            </div>
          </div>
        `;
      }

      return `
        <div class="chat-msg-user">
          <div>
            <div class="msg-bubble" style="${baseStyle};${sanitizePatchCss(cc.userBubbleCss || '')}">
              ${escapePatchHtml(msg.content)}
            </div>
            ${getChatTimestampHtml(msg, idx)}
          </div>
        </div>
      `;
    }

    const persona = appData.aiSettings.persona || {};
    const avatarHtml = persona.avatar
      ? `<div class="msg-avatar"><img src="${persona.avatar}" alt="AI"></div>`
      : `<div class="msg-avatar">🤖</div>`;

    if (msg.type === 'sticker') {
      return `
        <div class="chat-msg-ai">
          ${avatarHtml}
          <div class="msg-bubble-wrap">
            <div class="msg-sticker"><img src="${msg.content}" alt="AI表情包"></div>
            ${getChatTimestampHtml(msg, idx)}
          </div>
        </div>
      `;
    }

    if (msg.type === 'image') {
      return `
        <div class="chat-msg-ai">
          ${avatarHtml}
          <div class="msg-bubble-wrap">
            <div class="msg-image"><img src="${msg.content}" alt="AI图片"></div>
            ${getChatTimestampHtml(msg, idx)}
          </div>
        </div>
      `;
    }

    if (msg.type === 'bill' && msg.items && msg.items.length > 0) {
      return `
        <div class="chat-msg-ai">
          ${avatarHtml}
          <div class="msg-bubble-wrap">
            <div class="msg-bubble" style="${baseStyle};${sanitizePatchCss(cc.aiBubbleCss || '')}">
              ${escapePatchHtml(msg.content)}
            </div>
            ${renderInlineBillCards(msg.items, idx)}
            ${getChatTimestampHtml(msg, idx)}
          </div>
        </div>
      `;
    }

    return `
      <div class="chat-msg-ai">
        ${avatarHtml}
        <div class="msg-bubble-wrap">
          <div class="msg-bubble" style="${baseStyle};${sanitizePatchCss(cc.aiBubbleCss || '')}">
            ${escapePatchHtml(msg.content)}
          </div>
          ${getChatTimestampHtml(msg, idx)}
        </div>
      </div>
    `;
  }).join('');
}

/* ---------- 聊天顶部工具栏和设置弹窗 ---------- */

function injectChatAdvancedTools() {
  if (document.getElementById('chatToolsRow')) return;

  const header = document.querySelector('#pageChat .chat-header-bar');
  if (!header) return;

  const row = document.createElement('div');
  row.className = 'chat-tools-row';
  row.id = 'chatToolsRow';
  row.innerHTML = `
    <button class="chat-tool-btn" onclick="openChatSettings()">⚙ 聊天设置</button>
    <button class="chat-tool-btn" onclick="exportChatHistory()">导出聊天</button>
    <button class="chat-tool-btn" onclick="clearChatHistory()">清空</button>
    <button class="chat-tool-btn primary" id="chatGenerateReplyBtn" onclick="generateBatchReply()">生成回复</button>
  `;

  header.insertAdjacentElement('afterend', row);
  updateChatReplyModeUI();
}

function updateChatReplyModeUI() {
  ensureChatAdvancedSettings();

  const btn = document.getElementById('chatGenerateReplyBtn');
  if (!btn) return;

  btn.style.display = appData.aiSettings.chatAdvanced.replyMode === 'batch' ? 'block' : 'none';
}

function ensureChatSettingsPanel() {
  if (document.getElementById('chatSettingsOverlay')) return;

  const div = document.createElement('div');
  div.className = 'chat-settings-overlay';
  div.id = 'chatSettingsOverlay';
  div.innerHTML = `
    <div class="chat-settings-panel">
      <div class="chat-settings-title">
        <span>聊天设置</span>
        <button onclick="closeChatSettings()">×</button>
      </div>
      <div id="chatSettingsContent"></div>
    </div>
  `;

  div.addEventListener('click', e => {
    if (e.target === div) closeChatSettings();
  });

  document.body.appendChild(div);
}

function openChatSettings() {
  ensureChatAdvancedSettings();
  ensureChatSettingsPanel();
  renderChatSettingsContent();
  document.getElementById('chatSettingsOverlay').classList.add('show');
}

function closeChatSettings() {
  const el = document.getElementById('chatSettingsOverlay');
  if (el) el.classList.remove('show');
}

function renderChatSettingsContent() {
  ensureChatAdvancedSettings();

  const c = appData.aiSettings.chatAdvanced;
  const box = document.getElementById('chatSettingsContent');
  if (!box) return;

  box.innerHTML = `
    <div class="chat-setting-block">
      <div class="chat-setting-block-title">回复模式</div>

      <div class="chat-setting-row">
        <label>模式</label>
        <select id="chatReplyMode">
          <option value="instant" ${c.replyMode === 'instant' ? 'selected' : ''}>即时回复</option>
          <option value="batch" ${c.replyMode === 'batch' ? 'selected' : ''}>多条消息回复</option>
        </select>
      </div>
    </div>

    <div class="chat-setting-block">
      <div class="chat-setting-block-title">AI 回复自定义</div>

      <div class="chat-setting-row">
        <label>单条最多字数</label>
        <input type="number" id="chatMaxReplyChars" min="10" max="500" value="${c.maxReplyChars}">
      </div>

      <div class="chat-setting-row">
        <label>最少回复条数</label>
        <input type="number" id="chatMinReplies" min="1" max="10" value="${c.minReplies}">
      </div>

      <div class="chat-setting-row">
        <label>最多回复条数</label>
        <input type="number" id="chatMaxReplies" min="1" max="10" value="${c.maxReplies}">
      </div>

      <div class="chat-setting-row">
        <label>表情包</label>
        <select id="chatStickerMode">
          <option value="random" ${c.stickerMode === 'random' ? 'selected' : ''}>随机添加</option>
          <option value="always" ${c.stickerMode === 'always' ? 'selected' : ''}>每次必加</option>
          <option value="off" ${c.stickerMode === 'off' ? 'selected' : ''}>不自动加</option>
        </select>
      </div>
    </div>

    <div class="chat-setting-block">
      <div class="chat-setting-block-title">时间戳</div>

      <div class="chat-setting-row">
        <label>格式</label>
        <select id="chatTimestampFormat">
          <option value="HH:mm" ${c.timestampFormat === 'HH:mm' ? 'selected' : ''}>HH:mm</option>
          <option value="YYYY-MM-DD HH:mm" ${c.timestampFormat === 'YYYY-MM-DD HH:mm' ? 'selected' : ''}>YYYY-MM-DD HH:mm</option>
          <option value="MM/DD HH:mm" ${c.timestampFormat === 'MM/DD HH:mm' ? 'selected' : ''}>MM/DD HH:mm</option>
          <option value="今天 HH:mm" ${c.timestampFormat === '今天 HH:mm' ? 'selected' : ''}>今天 HH:mm</option>
        </select>
      </div>

      <div class="chat-setting-row">
        <label>样式 CSS</label>
        <textarea id="chatTimestampCss" placeholder="例如：color:#aaa;font-size:10px;">${escapePatchTextarea(c.timestampCss || '')}</textarea>
      </div>
    </div>

    <div class="chat-settings-actions">
      <button class="chat-muted-btn" onclick="closeChatSettings()">取消</button>
      <button class="chat-save-settings-btn" onclick="saveChatAdvancedSettings()">保存</button>
    </div>
  `;
}

function saveChatAdvancedSettings() {
  ensureChatAdvancedSettings();

  const c = appData.aiSettings.chatAdvanced;

  c.replyMode = document.getElementById('chatReplyMode').value;
  c.maxReplyChars = Math.max(10, parseInt(document.getElementById('chatMaxReplyChars').value) || 80);
  c.minReplies = Math.max(1, parseInt(document.getElementById('chatMinReplies').value) || 1);
  c.maxReplies = Math.max(c.minReplies, parseInt(document.getElementById('chatMaxReplies').value) || c.minReplies);
  c.stickerMode = document.getElementById('chatStickerMode').value;
  c.timestampFormat = document.getElementById('chatTimestampFormat').value;
  c.timestampCss = document.getElementById('chatTimestampCss').value.trim();

  saveData();
  updateChatReplyModeUI();
  renderChatMessages();
  closeChatSettings();
}

/* ---------- AI 请求 ---------- */

function splitUserInputMessages(text) {
  return String(text || '')
    .split('\n')
    .map(x => x.trim())
    .filter(Boolean);
}

async function sendChatMessage() {
  ensureChatAdvancedSettings();

  const textarea = document.getElementById('chatInputTextarea');
  const text = textarea.value.trim();
  if (!text) return;

  const messages = splitUserInputMessages(text);

  textarea.value = '';
  autoResizeTextarea(textarea);

  messages.forEach(msg => appendChatMessage('user', msg));

  if (appData.aiSettings.chatAdvanced.replyMode === 'instant') {
    await requestAiReply(messages);
  }
}

async function generateBatchReply() {
  ensureChatAdvancedSettings();

  const recentUserMessages = [];
  for (let i = chatMessages.length - 1; i >= 0; i--) {
    const msg = chatMessages[i];
    if (msg.role === 'ai') break;
    if (msg.role === 'user' && msg.type === 'text') recentUserMessages.unshift(msg.content);
  }

  if (recentUserMessages.length === 0) {
    alert('没有待回复的用户消息');
    return;
  }

  await requestAiReply(recentUserMessages);
}

async function requestAiReply(userMessages) {
  ensureChatAdvancedSettings();

  const typingId = 'typing_' + Date.now();
  showTypingIndicator(typingId);

  const c = appData.aiSettings.chatAdvanced;

  try {
    const url = typeof patchBuildApiUrl === 'function'
      ? patchBuildApiUrl(appData.aiSettings.apiChatEndpoint || '/api/ai/chat')
      : '/api/ai/chat';

    const headers = typeof patchAiHeaders === 'function'
      ? patchAiHeaders()
      : { 'Content-Type': 'application/json' };

    const stickerNotes = typeof getStickerNoteOptions === 'function'
      ? getStickerNoteOptions()
      : [];

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: appData.aiSettings.apiModel,
        messages: userMessages,
        message: userMessages.join('\n'),
        persona: appData.aiSettings.persona,
        stickerNotes,
        replySettings: {
          maxReplyChars: c.maxReplyChars,
          minReplies: c.minReplies,
          maxReplies: c.maxReplies,
          stickerMode: c.stickerMode,
        },
        history: chatMessages.slice(-20).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.type === 'text' ? m.content : `[${m.type}]`,
        })),
        instruction:
          `请回复 ${c.minReplies}-${c.maxReplies} 条。` +
          `每条不超过 ${c.maxReplyChars} 个中文字符。` +
          `如果要发表情包，只能从 stickerNotes 备注里选择，返回 stickerNotes。`
      })
    });

    removeTypingIndicator(typingId);

    if (!resp.ok) throw new Error(`请求失败 HTTP ${resp.status}`);

    const data = await resp.json();
    const replies = normalizeAiReplies(data.replies || []);
    const items = data.items || null;

    replies.forEach(reply => appendChatMessage('ai', reply));

if (items && items.length > 0) {
  receiptResults = items.map((item, index) => patchNormalizeReceiptItem(item, index));
  openReceiptResultModal();
}

handleAiStickerAfterReply(data, replies);

  } catch (err) {
    removeTypingIndicator(typingId);
    appendChatMessage('ai', '哎呀，请求失败啦：' + err.message);
  }
}

function normalizeAiReplies(replies) {
  ensureChatAdvancedSettings();

  const c = appData.aiSettings.chatAdvanced;
  let arr = Array.isArray(replies) ? replies : [String(replies || '')];

  arr = arr.map(x => String(x || '').trim()).filter(Boolean);

  if (arr.length === 0) arr = ['我收到啦。'];

  arr = arr.slice(0, c.maxReplies).map(x => {
    if (x.length <= c.maxReplyChars) return x;
    return x.slice(0, c.maxReplyChars);
  });

  while (arr.length < c.minReplies) {
    arr.push('我再想想这件事。');
  }

  return arr;
}

function handleAiStickerAfterReply(data, replies) {
  ensureChatAdvancedSettings();

  const c = appData.aiSettings.chatAdvanced;
  if (c.stickerMode === 'off') return;

  let notes = typeof getStickerNotesFromAiResponse === 'function'
    ? getStickerNotesFromAiResponse(data)
    : [];

  if (notes.length === 0 && typeof guessStickerNoteFromReplies === 'function') {
    const guessed = guessStickerNoteFromReplies(replies);
    if (guessed) notes = [guessed];
  }

  if (c.stickerMode === 'always' && notes.length === 0) {
    const available = typeof getStickerNoteOptions === 'function' ? getStickerNoteOptions() : [];
    if (available.length > 0) {
      notes = [available[Math.floor(Math.random() * available.length)]];
    }
  }

  if (c.stickerMode === 'random' && notes.length === 0) {
    if (Math.random() > 0.35) return;
    const available = typeof getStickerNoteOptions === 'function' ? getStickerNoteOptions() : [];
    if (available.length > 0) {
      notes = [available[Math.floor(Math.random() * available.length)]];
    }
  }

  if (typeof appendAiStickersByNotes === 'function') {
    appendAiStickersByNotes(notes);
  }
}

/* ---------- 初始化 ---------- */

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    ensureChatAdvancedSettings();
    loadChatHistory();
    injectChatAdvancedTools();
    ensureChatSettingsPanel();
    renderChatMessages();
  }, 600);
});

const oldSwitchPageChatAdvanced = window.switchPage;
window.switchPage = function(pageId, btn) {
  if (typeof oldSwitchPageChatAdvanced === 'function') {
    oldSwitchPageChatAdvanced(pageId, btn);
  }

  if (pageId === 'pageChat') {
    setTimeout(function() {
      ensureChatAdvancedSettings();
      loadChatHistory();
      injectChatAdvancedTools();
      ensureChatSettingsPanel();
      renderChatMessages();
    }, 80);
  }
};

/* =========================================================
   手动周期结转：工资晚发时，可暂不进入新周期
========================================================= */

function cyclePad(n) {
  return String(n).padStart(2, '0');
}

function cycleDateStr(d) {
  return d.getFullYear() + '-' + cyclePad(d.getMonth() + 1) + '-' + cyclePad(d.getDate());
}

function cycleParseDate(str) {
  const parts = String(str || '').split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function cycleSafeDate(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDay));
}

function cycleAddDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/* 根据你设置的“记账周期开始日”，算自然周期 */
function getNaturalCycleRangeByDate(dateObj) {
  const d = dateObj || new Date();
  const cycleStart = Number(appData.settings.cycleStart) || 1;

  let start;
  let nextStart;

  if (d.getDate() >= cycleStart) {
    start = cycleSafeDate(d.getFullYear(), d.getMonth(), cycleStart);
    nextStart = cycleSafeDate(d.getFullYear(), d.getMonth() + 1, cycleStart);
  } else {
    start = cycleSafeDate(d.getFullYear(), d.getMonth() - 1, cycleStart);
    nextStart = cycleSafeDate(d.getFullYear(), d.getMonth(), cycleStart);
  }

  const end = cycleAddDays(nextStart, -1);

  return {
    start: cycleDateStr(start),
    end: cycleDateStr(end),
  };
}

/* 初始化手动周期控制数据 */
function ensureManualCycleControl() {
  if (!appData.cycleControl) {
    const natural = getNaturalCycleRangeByDate(new Date());

    appData.cycleControl = {
      enabled: true,
      activeStart: natural.start,
      activeEnd: natural.end,
      lastPromptNaturalStart: '',
      lastActionAt: '',
    };

    saveData();
  }

  if (appData.cycleControl.enabled === undefined) appData.cycleControl.enabled = true;

  if (!appData.cycleControl.activeStart || !appData.cycleControl.activeEnd) {
    const natural = getNaturalCycleRangeByDate(new Date());
    appData.cycleControl.activeStart = natural.start;
    appData.cycleControl.activeEnd = natural.end;
  }

  if (appData.cycleControl.lastPromptNaturalStart === undefined) {
    appData.cycleControl.lastPromptNaturalStart = '';
  }

  if (appData.cycleControl.lastActionAt === undefined) {
    appData.cycleControl.lastActionAt = '';
  }

  saveData();
}

/*
  覆盖原来的 getCurrentCycleRange。

  关键点：
  1. 如果没到新周期，正常返回当前手动周期。
  2. 如果已经过了周期结束日，但你还没点“开始新周期”，
     就把结束日临时延长到今天。
     这样工资晚发的这几天仍然算在旧周期里。
*/
function getCurrentCycleRange() {
  ensureManualCycleControl();

  if (!appData.cycleControl.enabled) {
    return getNaturalCycleRangeByDate(new Date());
  }

  const today = todayStr();
  const activeStart = appData.cycleControl.activeStart;
  let activeEnd = appData.cycleControl.activeEnd;

  if (today > activeEnd) {
    activeEnd = today;
  }

  return {
    start: activeStart,
    end: activeEnd,
  };
}

/* 判断是否到自然新周期了 */
function shouldShowCycleRolloverPrompt() {
  ensureManualCycleControl();

  if (!appData.cycleControl.enabled) return false;

  const natural = getNaturalCycleRangeByDate(new Date());
  const activeStart = appData.cycleControl.activeStart;

  if (natural.start <= activeStart) return false;

  if (appData.cycleControl.lastPromptNaturalStart === natural.start) {
    return false;
  }

  return true;
}

/* 创建弹窗 */
function ensureCycleRolloverModal() {
  if (document.getElementById('cycleRolloverModal')) return;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'cycleRolloverModal';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-title">
        <span>是否开始新周期？</span>
        <button class="close-btn" onclick="deferCycleRollover()">×</button>
      </div>

      <div class="cycle-modal-tip">
        已经到了你设置的记账周期开始日。<br>
        如果工资还没发，可以先点“暂不开始”，当前周期会继续保留。<br>
        等工资到账后，再去“设置 → 记账周期控制”手动开始新周期。
      </div>

      <div class="cycle-modal-current" id="cycleRolloverInfo"></div>

      <div class="form-actions">
        <button class="btn-cancel" onclick="deferCycleRollover()">暂不开始</button>
        <button class="btn-save" onclick="startNewCycleNow()">开始新周期</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

/* 显示弹窗 */
function showCycleRolloverPrompt() {
  ensureManualCycleControl();
  ensureCycleRolloverModal();

  const natural = getNaturalCycleRangeByDate(new Date());
  const current = getCurrentCycleRange();
  const info = document.getElementById('cycleRolloverInfo');

  if (info) {
    info.innerHTML = `
      当前保留周期：${current.start} ~ ${current.end}<br>
      新自然周期：${natural.start} ~ ${natural.end}
    `;
  }

  document.getElementById('cycleRolloverModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

/* 暂不进入新周期 */
function deferCycleRollover() {
  ensureManualCycleControl();

  const natural = getNaturalCycleRangeByDate(new Date());

  appData.cycleControl.lastPromptNaturalStart = natural.start;
  appData.cycleControl.lastActionAt = new Date().toISOString();

  saveData();

  const modal = document.getElementById('cycleRolloverModal');
  if (modal) modal.classList.remove('show');

  document.body.style.overflow = '';

  renderCycleControlCard();
}

/*
  手动开始新周期。

  这里按你的需求：
  如果工资晚发，你点这个按钮的当天才作为新周期开始。
  这样工资晚发前几天的支出仍然留在旧周期里。
*/
function startNewCycleNow() {
  ensureManualCycleControl();

  const today = new Date();
  const natural = getNaturalCycleRangeByDate(today);
  const todayText = todayStr();

  appData.cycleControl.activeStart = todayText;
  appData.cycleControl.activeEnd = natural.end;
  appData.cycleControl.lastPromptNaturalStart = natural.start;
  appData.cycleControl.lastActionAt = new Date().toISOString();

  saveData();

  const modal = document.getElementById('cycleRolloverModal');
  if (modal) modal.classList.remove('show');

  document.body.style.overflow = '';

  renderAll();
  renderCycleControlCard();

  alert('已开始新周期，预算会从当前周期重新计算。');
}

/* 设置页插入周期控制卡片 */
function renderCycleControlCard() {
  ensureManualCycleControl();

  const settingsPage = document.querySelector('#pageSettings .page-content');
  if (!settingsPage) return;

  let card = document.getElementById('cycleControlCard');

  if (!card) {
    card = document.createElement('div');
    card.className = 'card';
    card.id = 'cycleControlCard';

    const firstCard = settingsPage.querySelector('.card');
    if (firstCard) {
      firstCard.insertAdjacentElement('afterend', card);
    } else {
      settingsPage.appendChild(card);
    }
  }

  const active = getCurrentCycleRange();
  const natural = getNaturalCycleRangeByDate(new Date());
  const holding = natural.start > appData.cycleControl.activeStart;

  card.innerHTML = `
    <div class="card-title">
      <span>记账周期控制</span>
      <span style="font-size:12px;color:${holding ? '#E91E63' : '#888'};">
        ${holding ? '正在保留旧周期' : '正常'}
      </span>
    </div>

    <div class="cycle-control-card">
      <div class="cycle-status-box">
        <div class="cycle-status-line">
          <span class="cycle-status-label">当前记账周期</span>
          <span class="cycle-status-value">${active.start} ~ ${active.end}</span>
        </div>
        <div class="cycle-status-line">
          <span class="cycle-status-label">自然周期</span>
          <span class="cycle-status-value">${natural.start} ~ ${natural.end}</span>
        </div>
      </div>

      <div class="cycle-control-help">
        到了周期开始日后，如果工资还没发，可以先保留旧周期。
        等工资到账后，点击“开始新周期”，预算会重新开始，账户实际余额会继续保留。
      </div>

      <div class="cycle-control-actions">
        <button class="cycle-start-btn" onclick="confirmStartNewCycleFromSettings()">开始新周期</button>
        <button class="cycle-muted-btn" onclick="resetCycleToNatural()">同步到自然周期</button>
      </div>
    </div>
  `;
}

function confirmStartNewCycleFromSettings() {
  ensureManualCycleControl();

  const active = getCurrentCycleRange();
  const natural = getNaturalCycleRangeByDate(new Date());

  const ok = confirm(
    `确定现在开始新周期吗？\n\n` +
    `当前周期：${active.start} ~ ${active.end}\n` +
    `新周期开始日：${todayStr()}\n` +
    `新周期结束日：${natural.end}\n\n` +
    `账户实际余额会保留，预算会按新周期重新计算。`
  );

  if (!ok) return;

  startNewCycleNow();
}

/* 如果你想不按延迟，直接回到系统自然周期，用这个 */
function resetCycleToNatural() {
  ensureManualCycleControl();

  const natural = getNaturalCycleRangeByDate(new Date());

  const ok = confirm(
    `确定同步到自然周期吗？\n\n` +
    `自然周期：${natural.start} ~ ${natural.end}\n\n` +
    `这会让本周期统计按你设置的周期开始日重新计算。`
  );

  if (!ok) return;

  appData.cycleControl.activeStart = natural.start;
  appData.cycleControl.activeEnd = natural.end;
  appData.cycleControl.lastPromptNaturalStart = natural.start;
  appData.cycleControl.lastActionAt = new Date().toISOString();

  saveData();
  renderAll();
  renderCycleControlCard();

  alert('已同步到自然周期。');
}

/* 检查是否需要弹窗 */
function checkCycleRolloverPrompt() {
  ensureManualCycleControl();

  if (shouldShowCycleRolloverPrompt()) {
    showCycleRolloverPrompt();
  }
}

/* 初始化 */
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    ensureManualCycleControl();
    renderCycleControlCard();
    checkCycleRolloverPrompt();
  }, 800);
});

/* 切到设置页时刷新卡片 */
const oldSwitchPageCycleControl = window.switchPage;
window.switchPage = function(pageId, btn) {
  if (typeof oldSwitchPageCycleControl === 'function') {
    oldSwitchPageCycleControl(pageId, btn);
  }

  if (pageId === 'pageSettings') {
    setTimeout(function() {
      renderCycleControlCard();
    }, 80);
  }
};

/* renderAll 后也刷新一次周期卡片 */
if (typeof window.renderAll === 'function' && !window.__cycleRenderAllPatched) {
  const oldRenderAllCycleControl = window.renderAll;

  window.renderAll = function() {
    oldRenderAllCycleControl();
    renderCycleControlCard();
  };

  window.__cycleRenderAllPatched = true;
}

/* =========================================================
   预算超支显示 / AI图片识别结果增强
========================================================= */

function patchBudgetCatBudget(cat) {
  let catBudget = Number(cat.budget) || 0;

  if (cat.subs && cat.subs.length > 0) {
    const subTotal = cat.subs.reduce((s, sub) => s + (Number(sub.budget) || 0), 0);
    if (subTotal > catBudget) catBudget = subTotal;
  }

  return catBudget;
}

function patchGetCycleBudgetInfo() {
  const cycleExpenses = appData.expenses.filter(e => isInCurrentCycle(e.date));
  const budgetCatNames = appData.budgetCategories.map(c => c.name);

  const categorizedTotal = cycleExpenses
    .filter(e => e.category && budgetCatNames.includes(e.category))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const totalBudget = appData.budgetCategories.reduce((s, c) => {
    return s + patchBudgetCatBudget(c);
  }, 0);

  const rawRemaining = totalBudget - categorizedTotal;

  return {
    totalBudget,
    categorizedTotal,
    budgetRemaining: Math.max(0, rawRemaining),
    budgetOver: Math.max(0, -rawRemaining),
    cycleExpenses,
  };
}

/* 覆盖余额计算：保留你之前修好的自由支配余额，同时显示预算超支 */
function calcBalances() {
  const initBalance = appData.settings.initBalance || 0;

  const totalIncome = appData.incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalAllExpense = appData.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalSaved = appData.savings.reduce((s, sv) => s + (Number(sv.amount) || 0), 0);
  const actualBalance = initBalance + totalIncome - totalAllExpense - totalSaved;

  const info = patchGetCycleBudgetInfo();
  const totalExpenseThisCycle = info.cycleExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const freeBalance = actualBalance - info.budgetRemaining;

  document.getElementById('freeBalance').textContent = formatMoney(freeBalance);
  document.getElementById('actualBalance').textContent = formatMoney(actualBalance);
  document.getElementById('totalExpense').textContent = formatMoney(totalExpenseThisCycle);
  document.getElementById('totalSaved').textContent = formatMoney(totalSaved);
  document.getElementById('balanceLabelFree').textContent =
    appData.settings.freeLabel || '♡ 自由支配余额';

  const cycleIncomes = appData.incomes.filter(i => isInCurrentCycle(i.date));
  const totalCycleIncome = cycleIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  document.getElementById('incomeTotal').textContent = formatMoney(totalCycleIncome);

  const budgetEl = document.getElementById('budgetRemaining');
  if (budgetEl) budgetEl.textContent = formatMoney(info.budgetRemaining);

  patchRenderBudgetOverText(info.budgetOver);
}

function patchRenderBudgetOverText(overAmount) {
  const budgetEl = document.getElementById('budgetRemaining');
  if (!budgetEl) return;

  const wrap = budgetEl.closest('.budget-remaining');
  if (!wrap) return;

  let overEl = document.getElementById('budgetOverText');

  if (!overEl) {
    overEl = document.createElement('div');
    overEl.id = 'budgetOverText';
    overEl.className = 'budget-over-text';
    budgetEl.insertAdjacentElement('afterend', overEl);
  }

  if (overAmount > 0) {
    wrap.classList.add('over');
    overEl.textContent = '已超支 ' + formatMoney(overAmount);
    overEl.style.display = 'block';
  } else {
    wrap.classList.remove('over');
    overEl.textContent = '';
    overEl.style.display = 'none';
  }
}

/* 覆盖首页预算分类：显示一级/二级超支 */
function renderBudgetCategories() {
  const list = document.getElementById('budgetCategoryList');

  if (!list) return;

  if (appData.budgetCategories.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:12px 0;">暂无预算分类</div>';
    return;
  }

  const cycleExpenses = appData.expenses.filter(e => isInCurrentCycle(e.date));

  list.innerHTML = appData.budgetCategories.map((cat, ci) => {
    const catSpent = cycleExpenses
      .filter(e => e.category === cat.name)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const catBudget = patchBudgetCatBudget(cat);
    const catOver = Math.max(0, catSpent - catBudget);
    const percent = catBudget > 0 ? Math.min(100, catSpent / catBudget * 100) : 0;
    const barClass = catOver > 0 ? 'over' : '';

    const subsHtml = (cat.subs || []).map(sub => {
      const subSpent = cycleExpenses
        .filter(e => e.category === cat.name && e.subCategory === sub.name)
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);

      const subBudget = Number(sub.budget) || 0;
      const subOver = Math.max(0, subSpent - subBudget);
      const subPct = subBudget > 0 ? Math.min(100, subSpent / subBudget * 100) : 0;
      const subBarClass = subOver > 0 ? 'over' : '';

      return `
        <div class="budget-sub-item">
          <span class="sub-name">${escapePatchHtml(sub.name)}</span>
          <span class="sub-budget">${formatMoney(subSpent)} / ${formatMoney(subBudget)}</span>
        </div>
        <div class="budget-progress" style="margin:0 0 4px 0;">
          <div class="budget-progress-bar ${subBarClass}" style="width:${subPct}%;${subPct > 80 && subOver <= 0 ? 'background:linear-gradient(135deg,#ff6b6b,#ee5a24)' : ''}"></div>
        </div>
        ${subOver > 0 ? `<div class="budget-sub-over">已超支 ${formatMoney(subOver)}</div>` : ''}
      `;
    }).join('');

    return `
      <div class="budget-category">
        <div class="budget-cat-header" onclick="toggleBudgetCat(${ci})">
          <div class="cat-name">${escapePatchHtml(cat.name)}</div>
          <div class="cat-amount">
            ${formatMoney(catSpent)} / ${formatMoney(catBudget)}
            ${cat.subs && cat.subs.length ? `<span class="toggle-arrow" id="budgetArrow${ci}">▼</span>` : ''}
          </div>
        </div>

        <div class="budget-progress" style="margin:0 12px;">
          <div class="budget-progress-bar ${barClass}" style="width:${percent}%;${percent > 80 && catOver <= 0 ? 'background:linear-gradient(135deg,#ff6b6b,#ee5a24)' : ''}"></div>
        </div>

        ${catOver > 0 ? `<div class="budget-cat-over">已超支 ${formatMoney(catOver)}</div>` : ''}

        <div class="budget-cat-body" id="budgetBody${ci}">${subsHtml}</div>
      </div>
    `;
  }).join('');
}

/* ---------- AI图片识别增强 ---------- */

function patchNormalizeReceiptItem(item, i) {
  const tags = Array.isArray(item.tags)
    ? item.tags
    : (item.tag ? [item.tag] : []);

  return {
    id: Date.now() + i + Math.random(),
    amount: Number(item.amount) || 0,
    category: item.category || '',
    subCategory: item.subCategory || item.subcategory || '',
    tags: tags.map(t => String(t).trim()).filter(Boolean),
    note: item.note || item.merchant || item.title || '',
    date: item.date || todayStr(),
    imageIndex: item.imageIndex !== undefined ? item.imageIndex : '',
    raw: item,
  };
}

async function recognizeReceipts() {
  patchEnsureAllDefaults();

  if (pendingImages.length === 0) {
    alert('请先上传图片');
    return;
  }

  const btn = document.getElementById('btnRecognize');

  if (btn) {
    btn.disabled = true;
    btn.classList.add('loading');

    const text = btn.querySelector('.btn-recognize-text');
    if (text) text.textContent = '识别中...';
  }

  try {
    const images = pendingImages.map(img => img.dataUrl);
    const url = patchBuildApiUrl(appData.aiSettings.apiReceiptEndpoint);

    const resp = await fetch(url, {
      method: 'POST',
      headers: patchAiHeaders(),
      body: JSON.stringify({
        model: appData.aiSettings.apiModel,
        images,
        categories: appData.budgetCategories.map(c => ({
          name: c.name,
          subs: (c.subs || []).map(s => s.name),
        })),
        tags: appData.settings.tags || [],
        instruction:
          '请识别图片中的消费账单。一个图片里可能有多笔账单，请拆成多条 items。' +
          '返回 JSON：{ items: [{ amount, category, subCategory, tags, note, date, imageIndex }] }。' +
          'category 必须优先使用 categories 里的一级分类，subCategory 必须优先使用对应 subs，tags 从 tags 列表中选择。'
      })
    });

    if (!resp.ok) {
  let message = '';

  try {
    const errorData = await resp.json();
    message = errorData.error || JSON.stringify(errorData);
  } catch (error) {
    message = await resp.text();
  }

  throw new Error(`识别失败 HTTP ${resp.status}：${message}`);
}

    const data = await resp.json();
    const items = Array.isArray(data.items) ? data.items : [];

    receiptResults = items.map((item, i) => patchNormalizeReceiptItem(item, i));

    if (receiptResults.length === 0) {
      alert('没有识别到明确账单。可以换一张更清晰的图片试试。');
      return;
    }

    openReceiptResultModal();

  } catch (err) {
    alert('识别出错：' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('loading');

      const text = btn.querySelector('.btn-recognize-text');
      if (text) text.textContent = '开始识别';
    }
  }
}

function patchGetCategoryOptions(selected) {
  const exists = appData.budgetCategories.some(c => c.name === selected);

  return `
    <option value="">请选择</option>
    ${appData.budgetCategories.map(c => `
      <option value="${escapePatchAttr(c.name)}" ${c.name === selected ? 'selected' : ''}>
        ${escapePatchHtml(c.name)}
      </option>
    `).join('')}
    ${selected && !exists ? `
      <option value="${escapePatchAttr(selected)}" selected>
        AI识别：${escapePatchHtml(selected)}（未在预算分类中）
      </option>
    ` : ''}
  `;
}

function patchGetSubCategoryOptions(category, selected) {
  const cat = appData.budgetCategories.find(c => c.name === category);
  const subs = cat && Array.isArray(cat.subs) ? cat.subs : [];
  const exists = subs.some(s => s.name === selected);

  return `
    <option value="">请选择 / 不填</option>
    ${subs.map(s => `
      <option value="${escapePatchAttr(s.name)}" ${s.name === selected ? 'selected' : ''}>
        ${escapePatchHtml(s.name)}
      </option>
    `).join('')}
    ${selected && !exists ? `
      <option value="${escapePatchAttr(selected)}" selected>
        AI识别：${escapePatchHtml(selected)}（未在二级分类中）
      </option>
    ` : ''}
  `;
}

function patchRenderReceiptTags(item, idx) {
  const tags = appData.settings.tags || [];

  if (tags.length === 0) {
    return '<div class="ric-empty-tags">暂无标签，可去基础资料设置里添加</div>';
  }

  return tags.map(tag => {
    const selected = (item.tags || []).includes(tag);

    return `
      <span
        class="ric-tag-chip ${selected ? 'selected' : ''}"
        onclick="toggleReceiptTag(${idx}, '${escapePatchAttr(tag)}')"
      >
        ${escapePatchHtml(tag)}
      </span>
    `;
  }).join('');
}

function renderReceiptResults() {
  const list = document.getElementById('receiptResultList');

  if (!list) return;

  if (receiptResults.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:20px 0;">无识别结果</div>';
    return;
  }

  list.innerHTML = receiptResults.map((item, i) => {
    const invalid = !item.amount || item.amount <= 0;
    const sourceText = item.imageIndex !== '' && item.imageIndex !== undefined
      ? `图片 ${Number(item.imageIndex) + 1}`
      : 'AI识别';

    const catExists = !item.category || appData.budgetCategories.some(c => c.name === item.category);

    return `
      <div class="receipt-item-card ${invalid ? 'invalid' : ''}" id="receiptCard${i}">
        <div class="ric-header">
          <span>
            <span class="ric-index">第 ${i + 1} 笔</span>
            <span class="ric-source">${sourceText}</span>
          </span>
          <button class="ric-del" onclick="deleteReceiptItem(${i})">🗑</button>
        </div>

        <div class="ric-row">
          <label>金额</label>
          <input type="number" step="0.01" value="${item.amount || ''}"
            onchange="receiptResults[${i}].amount=parseFloat(this.value)||0; renderReceiptResults();">
        </div>

        <div class="ric-row">
          <label>分类</label>
          <select id="receiptCatSel${i}" onchange="changeReceiptCategory(${i}, this.value)">
            ${patchGetCategoryOptions(item.category)}
          </select>
        </div>

        ${!catExists ? `<div class="ric-ai-warn">这个分类不在你的预算分类里，建议改成已有分类。</div>` : ''}

        <div class="ric-row">
          <label>二级</label>
          <select id="receiptSubSel${i}" onchange="receiptResults[${i}].subCategory=this.value">
            ${patchGetSubCategoryOptions(item.category, item.subCategory)}
          </select>
        </div>

        <div class="ric-row ric-tag-row">
          <label>标签</label>
          <div class="ric-tag-wrap">
            ${patchRenderReceiptTags(item, i)}
          </div>
        </div>

        <div class="ric-row">
          <label>备注</label>
          <input type="text" value="${escapePatchAttr(item.note || '')}"
            onchange="receiptResults[${i}].note=this.value" placeholder="选填">
        </div>

        <div class="ric-row">
          <label>日期</label>
          <input type="date" value="${item.date || todayStr()}"
            onchange="receiptResults[${i}].date=this.value">
        </div>
      </div>
    `;
  }).join('');
}

function changeReceiptCategory(idx, category) {
  if (!receiptResults[idx]) return;

  receiptResults[idx].category = category;
  receiptResults[idx].subCategory = '';

  renderReceiptResults();
}

function toggleReceiptTag(idx, tag) {
  if (!receiptResults[idx]) return;

  if (!Array.isArray(receiptResults[idx].tags)) {
    receiptResults[idx].tags = [];
  }

  const pos = receiptResults[idx].tags.indexOf(tag);

  if (pos >= 0) {
    receiptResults[idx].tags.splice(pos, 1);
  } else {
    receiptResults[idx].tags.push(tag);
  }

  renderReceiptResults();
}

function deleteReceiptItem(idx) {
  receiptResults.splice(idx, 1);
  renderReceiptResults();
}

function confirmAllReceipts() {
  if (receiptResults.length === 0) {
    closeReceiptResultModal();
    return;
  }

  let addedCount = 0;
  const skipped = [];

  receiptResults.forEach((item, idx) => {
    if (!item.amount || item.amount <= 0) {
      skipped.push(idx + 1);
      return;
    }

    appData.expenses.push({
      amount: Number(item.amount) || 0,
      category: item.category || '',
      subCategory: item.subCategory || '',
      tags: Array.isArray(item.tags) ? [...item.tags] : [],
      note: item.note || '图片识别',
      date: item.date || todayStr(),
      id: Date.now() + Math.random(),
      source: 'ai-receipt',
    });

    addedCount++;
  });

  saveData();

  receiptResults = [];
  pendingImages = [];

  if (typeof renderImagePreviews === 'function') {
    renderImagePreviews();
  }

  closeReceiptResultModal();
  renderAll();

  if (skipped.length > 0) {
    alert(`✅ 已添加 ${addedCount} 笔支出。\n有 ${skipped.length} 笔因金额无效被跳过：第 ${skipped.join('、')} 笔`);
  } else {
    alert(`✅ 已成功添加 ${addedCount} 笔支出记录`);
  }
}

/* ============ 最终修复：API 设置卡片开关 ============ */

function openApiSettingsCard() {
  const card = document.getElementById('apiSettingsCard');
  if (!card) return;

  const willShow = !card.classList.contains('show');

  card.classList.toggle('show', willShow);
  card.style.display = willShow ? 'block' : 'none';

  if (willShow) {
    if (typeof patchEnsureAllDefaults === 'function') patchEnsureAllDefaults();
    if (typeof populateApiSettings === 'function') populateApiSettings();
    if (typeof switchApiTab === 'function') switchApiTab(0);
  }
}

/* ============ 最终修复：底部对话框文字记账弹窗 ============ */

async function requestAiReply(userMessages) {
  ensureChatAdvancedSettings();

  const typingId = 'typing_' + Date.now();
  showTypingIndicator(typingId);

  const c = appData.aiSettings.chatAdvanced;

  try {
    const chatUrl = patchBuildApiUrl(appData.aiSettings.apiChatEndpoint || '/api/ai/chat');

    const stickerNotes = typeof getStickerNoteOptions === 'function'
      ? getStickerNoteOptions()
      : [];

    const resp = await fetch(chatUrl, {
      method: 'POST',
      headers: patchAiHeaders(),
      body: JSON.stringify({
        model: appData.aiSettings.apiModel,
        messages: userMessages,
        message: userMessages.join('\n'),
        persona: appData.aiSettings.persona,
        stickerNotes,
        replySettings: {
          maxReplyChars: c.maxReplyChars,
          minReplies: c.minReplies,
          maxReplies: c.maxReplies,
          stickerMode: c.stickerMode,
        },
        history: chatMessages.slice(-20).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.type === 'text' ? m.content : `[${m.type}]`,
        })),
        instruction:
          `请回复 ${c.minReplies}-${c.maxReplies} 条。` +
          `每条不超过 ${c.maxReplyChars} 个中文字符。` +
          `如果要发表情包，只能从 stickerNotes 备注里选择，返回 stickerNotes。`
      })
    });

    removeTypingIndicator(typingId);

    if (!resp.ok) {
      throw new Error(await patchReadResponseError(resp, '请求失败'));
    }

    const data = await resp.json();
    const replies = normalizeAiReplies(data.replies || []);

    replies.forEach(reply => appendChatMessage('ai', reply));

    handleAiStickerAfterReply(data, replies);

    // 关键：聊天回复之后，再调用文字记账解析接口。
    await requestChatTextBillPopup(userMessages.join('\n'));

  } catch (err) {
    removeTypingIndicator(typingId);
    appendChatMessage('ai', '哎呀，请求失败啦：' + err.message);
  }
}

async function requestChatTextBillPopup(text) {
  const cleanText = String(text || '').trim();
  if (!cleanText) return;

  try {
    const parseUrl = patchBuildApiUrl(appData.aiSettings.apiParseEndpoint || '/api/ai/parse-expense');

    const resp = await fetch(parseUrl, {
      method: 'POST',
      headers: patchAiHeaders(),
      body: JSON.stringify({
        model: appData.aiSettings.apiModel,
        text: cleanText,
        categories: appData.budgetCategories.map(c => ({
          name: c.name,
          subs: (c.subs || []).map(s => s.name),
        })),
        tags: appData.settings.tags || [],
        persona: appData.aiSettings.persona,
        instruction:
          '请判断用户文字里是否有明确消费、支出、收入或记账内容。' +
          '如果有消费支出，请返回 JSON：{ items: [{ amount, category, subCategory, tags, note, date }] }。' +
          '如果没有明确账单，请返回 { items: [] }。'
      })
    });

    if (!resp.ok) {
      throw new Error(await patchReadResponseError(resp, '文字记账解析失败'));
    }

    const data = await resp.json();
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length === 0) return;

    receiptResults = items.map((item, index) => {
      if (typeof patchNormalizeReceiptItem === 'function') {
        return patchNormalizeReceiptItem(item, index);
      }

      return {
        id: Date.now() + index + Math.random(),
        amount: Number(item.amount) || 0,
        category: item.category || '',
        subCategory: item.subCategory || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        note: item.note || 'AI 对话识别',
        date: item.date || todayStr(),
        imageIndex: '',
        raw: item,
      };
    });

    openReceiptResultModal();

  } catch (err) {
    appendChatMessage('ai', '我刚刚尝试整理账单，但解析失败了：' + err.message);
  }
}

async function patchReadResponseError(resp, fallback) {
  try {
    const data = await resp.json();
    return `${fallback} HTTP ${resp.status}：${data.error || JSON.stringify(data)}`;
  } catch (e) {
    const text = await resp.text();
    return `${fallback} HTTP ${resp.status}：${text || resp.statusText}`;
  }
}
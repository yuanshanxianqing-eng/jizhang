// ============ AI 模块 ============
// 所有 API 请求都走自己的后端代理，key 不在前端出现

// ---- 图片列表（待识别） ----
let pendingImages = []; // [{file, dataUrl}]
let receiptResults = []; // 识别后的账单列表

// ---- 面板切换 ----
function showAiPanel(panelId) {
  document.querySelectorAll('.ai-panel').forEach(p => p.classList.remove('show'));
  document.querySelectorAll('.ai-entry-card').forEach(c => c.classList.remove('active-card'));
  const panel = document.getElementById(panelId);
  const card = document.querySelector(`[data-panel="${panelId}"]`);
  if (panel) panel.classList.add('show');
  if (card) card.classList.add('active-card');
}

// ---- 图片上传预览 ----
function handleReceiptImages(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      pendingImages.push({ file, dataUrl: ev.target.result });
      renderImagePreviews();
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function renderImagePreviews() {
  const row = document.getElementById('imgPreviewRow');
  row.innerHTML = pendingImages.map((img, i) => `
    <div class="img-preview-thumb">
      <img src="${img.dataUrl}" alt="图片${i+1}">
      <button class="thumb-del" onclick="removeReceiptImage(${i})">×</button>
    </div>`).join('');
}

function removeReceiptImage(idx) {
  pendingImages 
.splice(idx, 1);
  renderImagePreviews();
}

// ---- 调用后端识别接口 ----
async function recognizeReceipts() {
  if (pendingImages.length === 0) {
    alert('请先上传图片');
    return;
  }
  const btn = document.getElementById('btnRecognize');
  btn.disabled = true;
  btn.classList.add('loading');
  btn.querySelector('.btn-recognize-text').textContent = '识别中...';

  try {
    // 将图片转为 base64 列表发给后端
    const images = pendingImages.map(img => img.dataUrl);
    const resp = await fetch('/api/ai/recognize-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images })
    });
    if (!resp.ok) throw new Error('，请检查 API 设置');
    const data = await resp.json();
    // 后端返回格式：{ items: [{amount, category, subCategory, note, date}] }
    receiptResults = (data.items || []).map((item, i) => ({
      id: Date.now() + i,
      amount: item.amount || 0,
      category: item.category || '',
      subCategory: item.subCategory || '',
      note: item.note || '',
      date: item.date || todayStr(),
    }));
    openReceiptResultModal();
  } catch (err) {
    alert('识别出错：' + err.message);
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.querySelector('.btn-recognize-text').textContent = '开始识别';
  }
}

// ---- 识别结果弹窗 ----
function openReceiptResultModal() {
  renderReceiptResults();
  document.getElementById('receiptResultModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeReceiptResultModal() {
  document.getElementById('receiptResultModal').classList.remove('show');
  document.body.style.overflow = '';
}

function renderReceiptResults() {
  const list = document.getElementById('receiptResultList');
  if (receiptResults.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:20px 0;">无识别结果</div>';
    return;
  }
  const catOptions = appData.budgetCategories.map(c =>
    `<option value="${c.name}">${c.name}</option>`
  ).join('');

  list.innerHTML = receiptResults.map((item, i) => `
    <div class="receipt-item-card" id="receiptCard${i}">
      <div class="ric-header">
        <span class="ric-index">第 ${i+1} 笔</span>
        <button class="ric-del" onclick="deleteReceiptItem(${i})">🗑</button>
      </div>
      <div class="ric-row">
        <label>金额</label>
        <input type="number" step="0.01" value="${item.amount}"
          onchange="receiptResults[${i}].amount=parseFloat(this.value)||0">
      </div>
      <div class="ric-row">
        <label>分类</label>
        <select onchange="receiptResults[${i}].category=this.value">
          <option value="">请选择</option>
          ${catOptions}
          <option value="${item.category}" ${!appData.budgetCategories.find(c=>c.name===item.category)?'selected':''}>
            ${item.category || '未分类'}
          </option>
        </select>
      </div>
      <div class="ric-row">
        <label>二级</label>
        <input type="text" value="${item.subCategory}"
          onchange="receiptResults[${i}].subCategory=this.value" placeholder="选填">
      </div>
      <div class="ric-row">
        <label>备注</label>
        <input type="text" value="${item.note}"
          onchange="receiptResults[${i}].note=this.value" placeholder="选填">
      </div>
      <div class="ric-row">
        <label>日期</label>
        <input type="date" value="${item.date}"
          onchange="receiptResults[${i}].date=this.value">
      </div>
    </div>`).join('');

  // 选中已有分类
  receiptResults.forEach((item, i) => {
    const sel = document.querySelector(`#receiptCard${i} select`);
    if (sel && item.category) sel.value = item.category;
  });
}

function deleteReceiptItem(idx) {
  receiptResults.splice(idx, 1);
  renderReceiptResults();
}

function confirmAllReceipts() {
  if (receiptResults.length === 0) { closeReceiptResultModal(); return; }
  let addedCount = 0;
  receiptResults.forEach(item => {
    if (!item.amount || item.amount <= 0) return;
    appData.expenses.push({
      amount: item.amount,
      category: item.category || '',
      subCategory: item.subCategory || '',
      tags: [],
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
  renderImagePreviews();
  closeReceiptResultModal();
  renderAll();
  alert(`✅ 已成功添加 ${addedCount} 笔支出记录`);
}

// ---- AI 聊天记账（在 AI 页面的输入区） ----
async function sendAiChatBill() {
  const textarea = document.getElementById('aiChatBillInput');
  const text = textarea.value.trim();
  if (!text) return;
  textarea.value = '';
  textarea.style.height = '52px';

  const btn = document.getElementById('aiChatBillSendBtn');
  btn.disabled = true;

  try {
    const resp = await fetch('/api/ai/parse-expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        categories: appData.budgetCategories.map(c => ({
          name: c.name,
          subs: (c.subs || []).map(s => s.name),
        })),
        persona: appData.aiSettings.persona,
      })
    });
    if (!resp.ok) throw new Error('解析失败');
    const data = await resp.json();
    // 后端返回：{ items: [{amount,category,subCategory,note,date}], replies: ['...'] }
    const items = data.items || [];
    const replies = data.replies || [];

    // 展示解析结果（在 AI 面板内）
    if (items.length > 0) {
      renderAiParsedItems(items, text);
    }

    // 将对话内容追加到对话框模块
    appendChatMessage('user', text);
    replies.forEach(r => appendChatMessage('ai', r));

    // 如果用户在 AI 页触发，顺带预存到待确认
    pendingChatBillItems = items;
  } catch (err) {
    alert('解析出错：' + err.message);
  } finally {
    btn.disabled = false;
  }
}

let pendingChatBillItems = [];

function renderAiParsedItems(items, originalText) {
  const container = document.getElementById('aiChatParsedArea');
  container.innerHTML = '';

  const catOptions = appData.budgetCategories.map(c =>
    `<option value="${c.name}">${c.name}</option>`
  ).join('');

  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.style.margin = '12px 0 0';

  wrapper.innerHTML = `
    <div class="card-title">
      <span>✨ 解析结果</span>
      <span style="font-size:12px;color:#888;">"${originalText.substring(0,20)}${originalText.length>20?'...':''}"</span>
    </div>
    <div class="receipt-result-list" id="aiParsedList"></div>
    <button class="btn-confirm-all" style="margin-top:12px;" onclick="confirmAiParsedItems()">✅ 确认全部添加</button>`;

  container.appendChild(wrapper);

  const list = document.getElementById('aiParsedList');
  list.innerHTML = items.map((item, i) => `
    <div class="receipt-item-card" id="aiParsedCard${i}">
      <div class="ric-header">
        <span class="ric-index">第 ${i+1} 笔</span>
        <button class="ric-del" onclick="pendingChatBillItems.splice(${i},1);document.getElementById('aiParsedCard${i}').remove()">🗑</button>
      </div>
      <div class="ric-row">
        <label>金额</label>
        <input type="number" step="0.01" value="${item.amount||''}"
          onchange="pendingChatBillItems[${i}].amount=parseFloat(this.value)||0">
      </div>
      <div class="ric-row">
        <label>分类</label>
        <select id="aiCatSel${i}" onchange="pendingChatBillItems[${i}].category=this.value">
          <option value="">请选择</option>
          ${catOptions}
        </select>
      </div>
      <div class="ric-row">
        <label>备注</label>
        <input type="text" value="${item.note||''}"
          onchange="pendingChatBillItems[${i}].note=this.value" placeholder="选填">
      </div>
      <div class="ric-row">
        <label>日期</label>
        <input type="date" value="${item.date||todayStr()}"
          onchange="pendingChatBillItems[${i}].date=this.value">
      </div>
    </div>`).join('');

  items.forEach((item, i) => {
    const sel = document.getElementById(`aiCatSel${i}`);
    if (sel && item.category) sel.value = item.category;
    pendingChatBillItems[i] = { ...item };
  });
}

function confirmAiParsedItems() {
  let added = 0;
  pendingChatBillItems.forEach(item => {
    if (!item.amount || item.amount <= 0) return;
    appData.expenses.push({
      amount: item.amount,
      category: item.category || '',
      subCategory: item.subCategory || '',
      tags: [],
      note: item.note || 'AI记账',
      date: item.date || todayStr(),
      id: Date.now() + Math.random(),
      source: 'ai-chat',
    });
    added++;
  });
  saveData();
  pendingChatBillItems = [];
  document.getElementById('aiChatParsedArea').innerHTML = '';
  renderAll();
  alert(`✅ 已添加 ${added} 笔支出`);
}

// ---- API 设置卡片 ----
function openApiSettingsCard() {
  document.getElementById('apiSettingsCard').classList.toggle('show');
  populateApiSettings();
}

function switchApiTab(tabIndex) {
  document.querySelectorAll('.api-card-tab').forEach((t, i) => {
    t.classList.toggle('active', i === tabIndex);
  });
  document.querySelectorAll('.api-card-page').forEach((p, i) => {
    p.classList.toggle('show', i === tabIndex);
  });
}

function populateApiSettings() {
  const ai = appData.aiSettings;
  document.getElementById('apiBaseUrl').value = ai.apiBaseUrl || '';
  document.getElementById('apiModel').value = ai.apiModel || 'gpt-4o';
  // 人设
  document.getElementById('personaName').value = ai.persona.name || '';
  document.getElementById('personaCallUser').value = ai.persona.callUser || '主人';
  document.getElementById('personaText').value = ai.persona.personality || '';
  // 人设头像
  const avatarEl = document.getElementById('personaAvatarPreview');
  if (ai.persona.avatar) {
    avatarEl.innerHTML = `<img src="${ai.persona.avatar}" alt="人设头像"><input type="file" accept="image/*" onchange="handlePersonaAvatar(event)">`;
  } else {
    avatarEl.innerHTML = `🤖<input type="file" accept="image/*" onchange="handlePersonaAvatar(event)">`;
  }
  // 表情包库
  renderStickerLibrary();
}

function saveApiSettings() {
  appData.aiSettings.apiBaseUrl = document.getElementById('apiBaseUrl').value.trim();
  appData.aiSettings.apiModel = document.getElementById('apiModel').value.trim() || 'gpt-4o';
  appData.aiSettings.persona.name = document.getElementById('personaName').value.trim() || '小金';
  appData.aiSettings.persona.callUser = document.getElementById('personaCallUser').value.trim() || '主人';
  appData.aiSettings.persona.personality = document.getElementById('personaText').value.trim();
  saveData();
  // 更新对话框头部显示
  renderChatHeader();
  alert('✅ 设置已保存');
}

function handlePersonaAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    appData.aiSettings.persona.avatar = ev.target.result;
    saveData();
    populateApiSettings();
    renderChatHeader();
  };
  reader.readAsDataURL(file);
}

// ---- 表情包库 ----
function renderStickerLibrary() {
  const lib = document.getElementById('stickerLibrary');
  const stickers = appData.aiSettings.stickers || [];
  lib.innerHTML = stickers.map((src, i) => `
    <div class="sticker-thumb">
      <img src="${src}" alt="sticker${i}">
      <button class="sticker-del" onclick="deleteSticker(${i})">×</button>
    </div>`).join('') +
  `<div class="sticker-upload-btn">
    ➕<span>上传</span>
    <input type="file" accept="image/*" multiple onchange="handleStickerUpload(event)">
  </div>`;
}

function handleStickerUpload(e) {
  const files = Array.from(e.target.files);
  let loaded = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      appData.aiSettings.stickers.push(ev.target.result);
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

function deleteSticker(idx) {
  appData.aiSettings.stickers.splice(idx, 1);
  saveData();
  renderStickerLibrary();
}

// ---- 获取随机表情包 ----
function getRandomSticker() {
  const stickers = appData.aiSettings.stickers || [];
  if (stickers.length === 0) return null;
  return stickers[Math.floor(Math.random() * stickers.length)];
}
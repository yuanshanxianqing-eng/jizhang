// ============ 对话框模块 ============

// 消息历史
let chatMessages = []; // [{role:'user'|'ai', type:'text'|'sticker'|'bill', content, items}]

// ========== 新增：保证旧数据也有新的自定义字段 ==========
function ensureChatCustomizeDefaults() {
  if (!appData.aiSettings) appData.aiSettings = {};
  if (!appData.aiSettings.chatCustomize) appData.aiSettings.chatCustomize = {};

  const cc = appData.aiSettings.chatCustomize;

  if (cc.bgColor === undefined) cc.bgColor = '#FFF0F5';
  if (cc.bgOpacity === undefined) cc.bgOpacity = 1;
  if (cc.bgImage === undefined) cc.bgImage = '';

  if (cc.fontFamily === undefined) cc.fontFamily = '';
  if (cc.fontCss === undefined) cc.fontCss = '';
  if (cc.bubbleFontSize === undefined) cc.bubbleFontSize = 14;

  // 单独气泡 CSS
  if (cc.aiBubbleCss === undefined) {
    cc.aiBubbleCss = '';
  }

  if (cc.userBubbleCss === undefined) {
    cc.userBubbleCss = '';
  }

  saveData();
}

// ---- 渲染对话框头部 ----
function renderChatHeader() {
  if (!appData.aiSettings || !appData.aiSettings.persona) return;

  const persona = appData.aiSettings.persona;
  const nameEl = document.getElementById('chatAiName');
  const avatarEl = document.getElementById('chatAiAvatarImg');

  if (nameEl) nameEl.textContent = persona.name || '小金';

  if (avatarEl) {
    if (persona.avatar) {
      avatarEl.innerHTML = `<img src="${persona.avatar}" alt="AI">`;
    } else {
      avatarEl.innerHTML = '🤖';
    }
  }
}

// ---- 追加消息 ----
function appendChatMessage(role, content, type = 'text', items = null) {
  const msg = {
    role,
    type,
    content,
    items,
    time: Date.now()
  };

  chatMessages.push(msg);
  renderChatMessages();

  setTimeout(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, 50);
}

// ---- 渲染消息列表 ----
function renderChatMessages() {
  ensureChatCustomizeDefaults();

  const list = document.getElementById('chatMessageList');
  if (!list) return;

  const cc = appData.aiSettings.chatCustomize;
  const baseStyle = getBubbleBaseStyle();

  list.innerHTML = chatMessages.map((msg, idx) => {
    if (msg.role === 'user') {
      return `
        <div class="chat-msg-user">
          <div class="msg-bubble" style="${baseStyle};${sanitizeInlineCss(cc.userBubbleCss)}">
            ${escapeHtml(msg.content)}
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
            <div class="msg-sticker"><img src="${msg.content}" alt="表情包"></div>
          </div>
        </div>
      `;
    }

    if (msg.type === 'bill' && msg.items && msg.items.length > 0) {
      return `
        <div class="chat-msg-ai">
          ${avatarHtml}
          <div class="msg-bubble-wrap">
            <div class="msg-bubble" style="${baseStyle};${sanitizeInlineCss(cc.aiBubbleCss)}">
              ${escapeHtml(msg.content)}
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
          <div class="msg-bubble" style="${baseStyle};${sanitizeInlineCss(cc.aiBubbleCss)}">
            ${escapeHtml(msg.content)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- 基础字体样式 ----
function getBubbleBaseStyle() {
  ensureChatCustomizeDefaults();

  const cc = appData.aiSettings.chatCustomize;
  const size = cc.bubbleFontSize || 14;

  let style = `font-size:${size}px;`;

  // 普通字体名
  if (cc.fontFamily && cc.fontFamily.trim()) {
    style += `font-family:${cc.fontFamily};`;
  }

  // 自定义字体 CSS，优先级更高
  if (cc.fontCss && cc.fontCss.trim()) {
    style += sanitizeInlineCss(cc.fontCss);
  }

  return style;
}

// ---- 简单清理 CSS，避免把 style 标签一类的东西塞进去 ----
function sanitizeInlineCss(css) {
  if (!css) return '';

  return String(css)
    .replace(/<style[\s\S]*?>/gi, '')
    .replace(/<\/style>/gi, '')
    .replace(/<script[\s\S]*?>/gi, '')
    .replace(/<\/script>/gi, '')
    .trim();
}

// ---- 渲染内联账单卡片 ----
function renderInlineBillCards(items, msgIdx) {
  const catOptions = appData.budgetCategories.map(c =>
    `<option value="${c.name}">${c.name}</option>`
  ).join('');

  return items.map((item, i) => `
    <div class="chat-bill-card" id="chatBillCard_${msgIdx}_${i}">
      <div class="cbc-title">📝 第 ${i + 1} 笔账单</div>

      <div class="cbc-row">
        <label>金额</label>
        <input type="number" step="0.01" value="${item.amount || ''}"
          onchange="chatMessages[${msgIdx}].items[${i}].amount=parseFloat(this.value)||0">
      </div>

      <div class="cbc-row">
        <label>分类</label>
        <select id="chatCatSel_${msgIdx}_${i}"
          onchange="chatMessages[${msgIdx}].items[${i}].category=this.value">
          <option value="">请选择</option>
          ${catOptions}
        </select>
      </div>

      <div class="cbc-row">
        <label>备注</label>
        <input type="text" value="${item.note || ''}"
          onchange="chatMessages[${msgIdx}].items[${i}].note=this.value">
      </div>

      <div class="cbc-row">
        <label>日期</label>
        <input type="date" value="${item.date || todayStr()}"
          onchange="chatMessages[${msgIdx}].items[${i}].date=this.value">
      </div>

      <div class="cbc-actions">
        <button class="cbc-btn-confirm" onclick="confirmChatBillItem(${msgIdx},${i})">✅ 确认记账</button>
        <button class="cbc-btn-del" onclick="deleteChatBillItem(${msgIdx},${i})">删除</button>
      </div>
    </div>
  `).join('');
}

// ---- 确认聊天账单 ----
function confirmChatBillItem(msgIdx, itemIdx) {
  const item = chatMessages[msgIdx].items[itemIdx];

  if (!item || !item.amount || item.amount <= 0) {
    alert('请填写有效金额');
    return;
  }

  appData.expenses.push({
    amount: item.amount,
    category: item.category || '',
    subCategory: item.subCategory || '',
    tags: [],
    note: item.note || 'AI聊天记账',
    date: item.date || todayStr(),
    id: Date.now() + Math.random(),
    source: 'ai-chat',
  });

  saveData();
  renderAll();

  chatMessages[msgIdx].items.splice(itemIdx, 1);
  renderChatMessages();

  const persona = appData.aiSettings.persona || {};
  const callUser = persona.callUser || '主人';

  const confirmPhrases = [
    `好的，已经帮${callUser}记上啦！💰`,
    `✅ 记好了！${callUser}真棒，好好管理钱钱！`,
    `已记账～${callUser}的钱包管理越来越好了！🌸`,
  ];

  const phrase = confirmPhrases[Math.floor(Math.random() * confirmPhrases.length)];
  appendChatMessage('ai', phrase);

  if (Math.random() < 0.3) {
    const sticker = getRandomSticker();
    if (sticker) {
      setTimeout(() => appendChatMessage('ai', sticker, 'sticker'), 400);
    }
  }
}

function deleteChatBillItem(msgIdx, itemIdx) {
  chatMessages[msgIdx].items.splice(itemIdx, 1);
  renderChatMessages();
}

// ---- 发送对话消息 ----
async function sendChatMessage() {
  const textarea = document.getElementById('chatInputTextarea');
  const text = textarea.value.trim();

  if (!text) return;

  textarea.value = '';
  autoResizeTextarea(textarea);

  const sendBtn = document.getElementById('chatSendBtn');
  sendBtn.disabled = true;

  appendChatMessage('user', text);

  const typingId = 'typing_' + Date.now();
  showTypingIndicator(typingId);

  try {
    const resp = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        persona: appData.aiSettings.persona,
        categories: appData.budgetCategories.map(c => ({
          name: c.name,
          subs: (c.subs || []).map(s => s.name),
        })),
        history: chatMessages.slice(-10).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      })
    });

    removeTypingIndicator(typingId);

    if (!resp.ok) throw new Error('请求失败');

    const data = await resp.json();
    const replies = data.replies || [];
    const items = data.items || null;

    if (items && items.length > 0) {
      replies.forEach((r, i) => {
        if (i === replies.length - 1) {
          appendChatMessage('ai', r, 'bill', items);
        } else {
          appendChatMessage('ai', r);
        }
      });
    } else {
      replies.forEach(r => appendChatMessage('ai', r));
    }

    if (Math.random() < 0.25) {
      const sticker = getRandomSticker();
      if (sticker) {
        setTimeout(() => appendChatMessage('ai', sticker, 'sticker'), 600);
      }
    }

  } catch (err) {
    removeTypingIndicator(typingId);
    appendChatMessage('ai', '哎呀，好像出了点问题…稍后再试试吧 🥺');
  } finally {
    sendBtn.disabled = false;
  }
}

// ---- 打字中指示器 ----
function showTypingIndicator(id) {
  const list = document.getElementById('chatMessageList');
  if (!list) return;

  const persona = appData.aiSettings.persona || {};
  const avatarHtml = persona.avatar
    ? `<div class="msg-avatar"><img src="${persona.avatar}" alt="AI"></div>`
    : `<div class="msg-avatar">🤖</div>`;

  const div = document.createElement('div');
  div.className = 'chat-msg-ai';
  div.id = id;

  div.innerHTML = `
    ${avatarHtml}
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;

  list.appendChild(div);
  window.scrollTo(0, document.body.scrollHeight);
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ========== 对话框自定义 ==========

function toggleChatCustomize() {
  ensureChatCustomizeDefaults();

  const panel = document.getElementById('chatCustomizePanel');
  panel.classList.toggle('show');

  if (panel.classList.contains('show')) {
    populateChatCustomize();
  }
}

// ---- 生成自定义面板内容 ----
function populateChatCustomize() {
  ensureChatCustomizeDefaults();

  const panel = document.getElementById('chatCustomizePanel');
  if (!panel) return;

  const cc = appData.aiSettings.chatCustomize;

  panel.innerHTML = `
    <div class="ccp-title">🎨 对话框自定义</div>

    <div class="ccp-block">
      <div class="ccp-block-title">
        <span>背景设置</span>
      </div>

      <div class="ccp-row">
        <label>背景颜色</label>
        <input type="color" id="chatBgColorPicker" value="${cc.bgColor || '#FFF0F5'}" oninput="updateChatBgColor(this.value)">
        <input type="text" id="chatBgColorText" value="${cc.bgColor || '#FFF0F5'}" placeholder="#FFF0F5" onchange="updateChatBgColor(this.value)">
      </div>

      <div class="ccp-row">
        <label>不透明度</label>
        <input type="range" id="chatBgOpacityRange" min="0" max="1" step="0.01" value="${cc.bgOpacity ?? 1}" oninput="updateChatBgOpacity(this.value)">
        <span id="chatBgOpacityText" style="font-size:12px;color:#888;width:42px;">${Math.round((cc.bgOpacity ?? 1) * 100)}%</span>
      </div>

      <div class="ccp-row">
        <label>背景图片</label>
        <div style="position:relative;display:inline-block;">
          <button class="btn-small">选择图片</button>
          <input type="file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" onchange="handleChatBgUpload(event)">
        </div>
        <button class="btn-small" style="background:#f5f5f5;color:#888;" onclick="clearChatBgImage()">清除图片</button>
      </div>

      <div class="ccp-help">
        小提示：如果你上传了背景图，背景颜色会作为一层透明遮罩盖在图片上，可以通过不透明度调节氛围。
      </div>
    </div>

    <div class="ccp-block">
      <div class="ccp-block-title">
        <span>字体设置</span>
        <button class="ccp-mini-btn" onclick="resetFontCustomize()">重置字体</button>
      </div>

      <div class="ccp-row">
        <label>字体名称</label>
        <input type="text" id="chatFontFamilyInput" value="${escapeAttr(cc.fontFamily || '')}" placeholder='例如：Microsoft YaHei, 宋体, serif' onchange="saveChatFontFamily()">
      </div>

      <div class="ccp-row">
        <label>字体大小</label>
        <input type="number" id="chatFontSize" value="${cc.bubbleFontSize || 14}" min="11" max="24" onchange="saveChatFontSize()">
        <span style="font-size:12px;color:#888;">px</span>
      </div>

      <label style="font-size:13px;color:#888;margin-bottom:6px;display:block;">字体 CSS</label>
      <textarea class="ccp-css-textarea" id="chatFontCssInput" placeholder="例如：
font-family: 'Microsoft YaHei', sans-serif;
font-weight: 500;
letter-spacing: 0.5px;" onchange="saveChatFontCss()">${escapeTextarea(cc.fontCss || '')}</textarea>

      <div class="ccp-help">
        这里可以写会作用在所有聊天文字上的 CSS。比如 font-family、font-weight、letter-spacing。
      </div>
    </div>

    <div class="ccp-block">
      <div class="ccp-block-title">
        <span>AI 气泡框 CSS</span>
        <button class="ccp-mini-btn" onclick="useAiBubblePreset()">套用示例</button>
      </div>

      <textarea class="ccp-css-textarea" id="aiBubbleCssInput" placeholder="例如：
background: rgba(255,255,255,0.9);
border: 1px solid #FFB6C1;
border-radius: 20px 20px 20px 6px;
color: #333;
box-shadow: 0 4px 12px rgba(255,182,193,0.25);" onchange="saveAiBubbleCss()">${escapeTextarea(cc.aiBubbleCss || '')}</textarea>

      <div class="ccp-help">
        只影响 AI 左侧气泡。不要写 <style>，直接写 CSS 属性即可。
      </div>
    </div>

    <div class="ccp-block">
      <div class="ccp-block-title">
        <span>用户气泡框 CSS</span>
        <button class="ccp-mini-btn" onclick="useUserBubblePreset()">套用示例</button>
      </div>

      <textarea class="ccp-css-textarea" id="userBubbleCssInput" placeholder="例如：
background: linear-gradient(135deg,#FF9EC4,#87CEEB);
border-radius: 20px 20px 6px 20px;
color: white;
box-shadow: 0 4px 12px rgba(135,206,235,0.3);" onchange="saveUserBubbleCss()">${escapeTextarea(cc.userBubbleCss || '')}</textarea>

      <div class="ccp-help">
        只影响你右侧发送的气泡。可以写渐变、阴影、边框、圆角等。
      </div>
    </div>

    <div class="ccp-block">
      <div class="ccp-block-title">
        <span>效果预览</span>
      </div>

      <div class="chat-style-preview" id="chatStylePreview">
        <div class="preview-ai" id="previewAiBubble">这是 AI 气泡预览～</div>
        <div class="preview-user" id="previewUserBubble">这是你的气泡预览 ♡</div>
      </div>
    </div>

    <div class="ccp-actions">
      <button class="ccp-reset-btn" onclick="resetChatCustomize()">恢复默认</button>
      <button class="ccp-save-btn" onclick="saveAllChatCustomize()">保存并应用</button>
    </div>
  `;

  updateChatStylePreview();
}

// ---- 背景颜色 ----
function updateChatBgColor(color) {
  ensureChatCustomizeDefaults();

  if (!isValidHexColor(color)) {
    alert('请输入正确颜色，比如 #FFF0F5');
    return;
  }

  appData.aiSettings.chatCustomize.bgColor = color;

  const colorText = document.getElementById('chatBgColorText');
  const colorPicker = document.getElementById('chatBgColorPicker');

  if (colorText) colorText.value = color;
  if (colorPicker) colorPicker.value = color;

  saveData();
  applyChatCustomize();
  updateChatStylePreview();
}

// ---- 背景不透明度 ----
function updateChatBgOpacity(value) {
  ensureChatCustomizeDefaults();

  const num = Math.min(1, Math.max(0, parseFloat(value)));
  appData.aiSettings.chatCustomize.bgOpacity = num;

  const text = document.getElementById('chatBgOpacityText');
  if (text) text.textContent = Math.round(num * 100) + '%';

  saveData();
  applyChatCustomize();
}

// ---- 背景图片上传 ----
function handleChatBgUpload(e) {
  ensureChatCustomizeDefaults();

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    appData.aiSettings.chatCustomize.bgImage = ev.target.result;
    saveData();
    applyChatCustomize();
  };

  reader.readAsDataURL(file);
  e.target.value = '';
}

function clearChatBgImage() {
  ensureChatCustomizeDefaults();

  appData.aiSettings.chatCustomize.bgImage = '';
  saveData();
  applyChatCustomize();
}

// ---- 应用背景 ----
function applyChatCustomize() {
  ensureChatCustomizeDefaults();

  const cc = appData.aiSettings.chatCustomize;
  const container = document.getElementById('chatBgContainer');

  if (!container) return;

  const rgb = hexToRgb(cc.bgColor || '#FFF0F5');

  container.style.setProperty('--chat-bg-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  container.style.setProperty('--chat-bg-opacity', cc.bgOpacity ?? 1);

  if (cc.bgImage) {
    container.style.backgroundImage = `url(${cc.bgImage})`;
    container.classList.add('has-chat-bg');
  } else {
    container.style.backgroundImage = '';
    container.classList.remove('has-chat-bg');
  }

  renderChatMessages();
}

// ---- 字体 ----
function saveChatFontFamily() {
  ensureChatCustomizeDefaults();

  const input = document.getElementById('chatFontFamilyInput');
  appData.aiSettings.chatCustomize.fontFamily = input ? input.value.trim() : '';

  saveData();
  renderChatMessages();
  updateChatStylePreview();
}

function saveChatFontSize() {
  ensureChatCustomizeDefaults();

  const val = parseInt(document.getElementById('chatFontSize').value) || 14;
  appData.aiSettings.chatCustomize.bubbleFontSize = Math.min(24, Math.max(11, val));

  saveData();
  renderChatMessages();
  updateChatStylePreview();
}

function saveChatFontCss() {
  ensureChatCustomizeDefaults();

  const input = document.getElementById('chatFontCssInput');
  appData.aiSettings.chatCustomize.fontCss = input ? input.value.trim() : '';

  saveData();
  renderChatMessages();
  updateChatStylePreview();
}

function resetFontCustomize() {
  ensureChatCustomizeDefaults();

  appData.aiSettings.chatCustomize.fontFamily = '';
  appData.aiSettings.chatCustomize.fontCss = '';
  appData.aiSettings.chatCustomize.bubbleFontSize = 14;

  saveData();
  populateChatCustomize();
  renderChatMessages();
}

// ---- 气泡 CSS ----
function saveAiBubbleCss() {
  ensureChatCustomizeDefaults();

  const input = document.getElementById('aiBubbleCssInput');
  appData.aiSettings.chatCustomize.aiBubbleCss = input ? input.value.trim() : '';

  saveData();
  renderChatMessages();
  updateChatStylePreview();
}

function saveUserBubbleCss() {
  ensureChatCustomizeDefaults();

  const input = document.getElementById('userBubbleCssInput');
  appData.aiSettings.chatCustomize.userBubbleCss = input ? input.value.trim() : '';

  saveData();
  renderChatMessages();
  updateChatStylePreview();
}

function useAiBubblePreset() {
  ensureChatCustomizeDefaults();

  const preset = `background: rgba(255,255,255,0.9);
border: 1.5px solid rgba(255,182,193,0.7);
border-radius: 22px 22px 22px 6px;
color: #333;
box-shadow: 0 4px 14px rgba(255,182,193,0.25);
backdrop-filter: blur(6px);`;

  appData.aiSettings.chatCustomize.aiBubbleCss = preset;
  saveData();
  populateChatCustomize();
  renderChatMessages();
}

function useUserBubblePreset() {
  ensureChatCustomizeDefaults();

  const preset = `background: linear-gradient(135deg, #FF9EC4 0%, #87CEEB 100%);
border-radius: 22px 22px 6px 22px;
color: #fff;
box-shadow: 0 4px 14px rgba(135,206,235,0.35);
font-weight: 500;`;

  appData.aiSettings.chatCustomize.userBubbleCss = preset;
  saveData();
  populateChatCustomize();
  renderChatMessages();
}

// ---- 预览 ----
function updateChatStylePreview() {
  ensureChatCustomizeDefaults();

  const cc = appData.aiSettings.chatCustomize;
  const previewBox = document.getElementById('chatStylePreview');
  const previewAi = document.getElementById('previewAiBubble');
  const previewUser = document.getElementById('previewUserBubble');

  if (!previewAi || !previewUser) return;

  const baseStyle = getBubbleBaseStyle();

  previewAi.style.cssText = '';
  previewUser.style.cssText = '';

  previewAi.setAttribute('style', baseStyle + ';' + sanitizeInlineCss(cc.aiBubbleCss));
  previewUser.setAttribute('style', baseStyle + ';' + sanitizeInlineCss(cc.userBubbleCss));

  if (previewBox) {
    const rgb = hexToRgb(cc.bgColor || '#FFF0F5');
    previewBox.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${cc.bgOpacity ?? 1})`;
  }
}

// ---- 保存全部 ----
function saveAllChatCustomize() {
  ensureChatCustomizeDefaults();

  saveChatFontFamily();
  saveChatFontSize();
  saveChatFontCss();
  saveAiBubbleCss();
  saveUserBubbleCss();

  saveData();
  applyChatCustomize();
  renderChatMessages();

  alert('✅ 对话框样式已保存');
}

// ---- 恢复默认 ----
function resetChatCustomize() {
  if (!confirm('确定恢复对话框默认样式吗？')) return;

  appData.aiSettings.chatCustomize = {
    bgImage: '',
    bgColor: '#FFF0F5',
    bgOpacity: 1,
    fontFamily: '',
    fontCss: '',
    bubbleFontSize: 14,
    aiBubbleCss: '',
    userBubbleCss: '',
  };

  saveData();
  populateChatCustomize();
  applyChatCustomize();
  renderChatMessages();
}

// ========== 工具函数 ==========

function autoResizeTextarea(el) {
  el.style.height = '44px';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeTextarea(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isValidHexColor(color) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(color).trim());
}

function hexToRgb(hex) {
  let clean = String(hex || '#FFF0F5').replace('#', '').trim();

  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }

  const num = parseInt(clean, 16);

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}
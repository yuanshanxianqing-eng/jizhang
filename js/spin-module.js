// ============ 赛博转盘 & 赛博硬币 ============

// ---- 转盘 ----
let wheelSpinning = false;
let wheelCurrentAngle = 0;

const WHEEL_COLORS = [
  ['#FFB6C1', '#fff'],
  ['#87CEEB', '#fff'],
  ['#FFD1DC', '#555'],
  ['#B0E0E6', '#555'],
  ['#FFC0CB', '#fff'],
  ['#ADD8E6', '#fff'],
  ['#FFDAB9', '#555'],
  ['#E0BBE4', '#fff'],
];

function initCyberWheel() {
  drawWheel();
  renderWheelOptionsEdit();
}

function drawWheel() {
  const canvas = document.getElementById('cyberWheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const options = appData.aiSettings.wheelOptions;
  const n = options.length;
  if (n === 0) return;

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const r = cx - 4;
  const sliceAngle = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, W, H);

  options.forEach((opt, i) => {
    const startAngle = wheelCurrentAngle + i * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const [bg, fg] = WHEEL_COLORS[i % WHEEL_COLORS.length];

    // 扇形
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 文字
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = fg;
    ctx.font = `bold ${Math.min(14, 80 / n)}px -apple-system, sans-serif`;
    ctx.fillText(opt.length > 5 ? opt.substring(0, 5) + '…' : opt, r - 10, 5);
    ctx.restore();
  });

  // 中心圆
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 18);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(1, '#FFB6C1');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function spinWheel() {
  if (wheelSpinning) return;
  const options = appData.aiSettings.wheelOptions;
  if (options.length === 0) { alert('请先添加转盘选项'); return; }

  wheelSpinning = true;
  const btn = document.getElementById('wheelSpinBtn');
  if (btn) btn.disabled = true;

  // 随机旋转圈数 + 随机落点
  const extraRounds = (5 + Math.floor(Math.random() * 5)) * Math.PI * 2;
  const targetSlice = Math.floor(Math.random() * options.length);
  const sliceAngle = (Math.PI * 2) / options.length;
  // 让指针（顶部，-π/2）指向目标扇形中心
  const targetAngle = -(targetSlice * sliceAngle + sliceAngle / 2) - Math.PI / 2;
  const totalRotation = extraRounds + ((targetAngle - wheelCurrentAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

  const startAngle = wheelCurrentAngle;
  const duration = 3500;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // 缓出曲线
    const ease = 1 - Math.pow(1 - progress, 4);
    wheelCurrentAngle = startAngle + totalRotation * ease;
    drawWheel();
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      wheelCurrentAngle = wheelCurrentAngle % (Math.PI * 2);
      wheelSpinning = false;
      if (btn) btn.disabled = false;
      showWheelResult(options[targetSlice]);
    }
  }
  requestAnimationFrame(animate);
}

function showWheelResult(result) {
  const toast = document.getElementById('wheelResultToast');
  document.getElementById('wheelResultText').textContent = result;
  // 随机表情
  const emojis = ['🎉', '✨', '💫', '🌸', '💕', '🎊', '⭐', '🍀'];
  document.getElementById('wheelResultEmoji').textContent = emojis[Math.floor(Math.random() * emojis.length)];
  document.getElementById('wheelResultSub').textContent = getWheelComment(result);
  toast.classList.add('show');
}

function closeWheelResult() {
  document.getElementById('wheelResultToast').classList.remove('show');
}

function getWheelComment(result) {
  const comments = {
    '买！': '转盘说买就买，剁手吧～',
    '不买！': '忍住！存起来更香！',
    '再想想': '再想想也没事，钱包谢谢你 💰',
    '犒劳自己': '辛苦了，犒劳一下自己吧 🎁',
    '存起来': '存起来！向财务自由迈进！',
    '问问钱包': '先摸摸钱包再决定 👛',
  };
  return comments[result] || '命运已决定，接受吧～';
}

// ---- 转盘选项编辑 ----
function renderWheelOptionsEdit() {
  const container = document.getElementById('wheelOptionsEdit');
  if (!container) return;
  const options = appData.aiSettings.wheelOptions;
  container.innerHTML = options.map((opt, i) => `
    <div class="wheel-option-row">
      <input type="text" value="${escapeHtml(opt)}" placeholder="选项内容"
        onchange="appData.aiSettings.wheelOptions[${i}]=this.value;saveData();drawWheel()">
      <button class="wor-del" onclick="deleteWheelOption(${i})">×</button>
    </div>`).join('') +
  `<button class="btn-add-wheel-option" onclick="addWheelOption()">＋ 添加选项</button>`;
}

function addWheelOption() {
  appData.aiSettings.wheelOptions.push('新选项');
  saveData();
  drawWheel();
  renderWheelOptionsEdit();
}

function deleteWheelOption(idx) {
  if (appData.aiSettings.wheelOptions.length <= 2) { alert('至少保留 2 个选项'); return; }
  appData.aiSettings.wheelOptions.splice(idx, 1);
  saveData();
  drawWheel();
  renderWheelOptionsEdit();
}

// ---- 赛博硬币 ----
let coinFlipping = false;
let coinHistory = []; // 'heads' | 'tails'

function flipCoin() {
  if (coinFlipping) return;
  coinFlipping = true;
  const coin = document.getElementById('cyberCoin');
  const resultEl = document.getElementById('coinResult');
  coin.classList.add('flipping');
  resultEl.textContent = '';

  setTimeout(() => {
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    coin.classList.remove('flipping');
    coin.textContent = result === 'heads' ? '🌸' : '💙';
    resultEl.textContent = result === 'heads' ? '正面 🌸 — 花花说可以！' : '反面 💙 — 蓝蓝说不行！';
    coinHistory.unshift(result);
    if (coinHistory.length > 10) coinHistory.pop();
    renderCoinHistory();
    coinFlipping = false;
  }, 700);
}

function renderCoinHistory() {
  const el = document.getElementById('coinHistory');
  if (!el) return;
  el.innerHTML = coinHistory.map(r =>
    `<span class="coin-hist-tag ${r}">${r === 'heads' ? '正 🌸' : '反 💙'}</span>`
  ).join('');
}
async function sendChatMessage() {
  const textarea = document.getElementById('chatInputTextarea');
  const text = textarea.value.trim();

  if (!text) return;

  textarea.value = '';
  autoResizeTextarea(textarea);

  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.disabled = true;

  appendChatMessage('user', text);

  const typingId = 'typing_' + Date.now();
  showTypingIndicator(typingId);

  try {
    patchEnsureAllDefaults();

    const url = patchBuildApiUrl(appData.aiSettings.apiChatEndpoint);
    const stickerNotes = getStickerNoteOptions();

    const resp = await fetch(url, {
      method: 'POST',
      headers: patchAiHeaders(),
      body: JSON.stringify({
        model: appData.aiSettings.apiModel,
        message: text,
        persona: appData.aiSettings.persona,
        stickerNotes,
        categories: appData.budgetCategories.map(c => ({
          name: c.name,
          subs: (c.subs || []).map(s => s.name),
        })),
        history: chatMessages.slice(-10).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.type === 'text' ? m.content : `[${m.type}]`,
        })),
        instruction:
          '你可以根据用户语气和你的回复，从 stickerNotes 中选择 0-2 个表情包备注。' +
          '不要识别表情包图片内容，只能根据备注名称选择。' +
          '返回 JSON：{ replies: string[], items?: array, stickerNotes?: string[] }。'
      })
    });

    removeTypingIndicator(typingId);

    if (!resp.ok) throw new Error(`请求失败 HTTP ${resp.status}`);

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

    // 重点：按备注发送表情包
    let selectedStickerNotes = getStickerNotesFromAiResponse(data);

    // 后端没返回时，本地按回复文字猜
    if (selectedStickerNotes.length === 0) {
      const guessed = guessStickerNoteFromReplies(replies);
      if (guessed) selectedStickerNotes = [guessed];
    }

    appendAiStickersByNotes(selectedStickerNotes);

  } catch (err) {
    removeTypingIndicator(typingId);
    appendChatMessage('ai', '哎呀，好像出了点问题…稍后再试试吧 🥺');

    const fallback = findStickerByNote('哭哭') || findStickerByNote('难过') || findStickerByNote('失败');
    if (fallback) {
      setTimeout(() => appendChatMessage('ai', fallback, 'sticker'), 400);
    }
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}
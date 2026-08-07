// ============ 全局主题自定义 ============

function ensureThemeSettings() {
  if (!appData.themeSettings) {
    appData.themeSettings = {
      enabled: true,

      primaryColor: '#FFB6C1',
      secondaryColor: '#87CEEB',
      gradientAngle: 135,

      pageBgColor: '#FFF0F5',
      pageBgOpacity: 1,
      pageBgImage: '',

      cardBgColor: '#FFFFFF',
      cardOpacity: 1,

      panelBgColor: '#FFF0F5',
      panelOpacity: 0.72,

      inputBgColor: '#FAFAFA',
      inputOpacity: 1,

      textColor: '#333333',
      subTextColor: '#888888',

      radius: 16,
      shadowOpacity: 0.08,
    };
    saveData();
  }

  const def = {
    enabled: true,
    primaryColor: '#FFB6C1',
    secondaryColor: '#87CEEB',
    gradientAngle: 135,
    pageBgColor: '#FFF0F5',
    pageBgOpacity: 1,
    pageBgImage: '',
    cardBgColor: '#FFFFFF',
    cardOpacity: 1,
    panelBgColor: '#FFF0F5',
    panelOpacity: 0.72,
    inputBgColor: '#FAFAFA',
    inputOpacity: 1,
    textColor: '#333333',
    subTextColor: '#888888',
    radius: 16,
    shadowOpacity: 0.08,
  };

  for (const k in def) {
    if (appData.themeSettings[k] === undefined) {
      appData.themeSettings[k] = def[k];
    }
  }
}

function applyCustomTheme() {
  ensureThemeSettings();

  const t = appData.themeSettings;
  const root = document.documentElement;
  const body = document.body;

  if (!t.enabled) {
    body.classList.remove('custom-theme-enabled');
    body.classList.remove('custom-theme-bg-image');
    return;
  }

  body.classList.add('custom-theme-enabled');

  const primaryRgb = hexToRgbTheme(t.primaryColor);
  const secondaryRgb = hexToRgbTheme(t.secondaryColor);
  const pageRgb = hexToRgbTheme(t.pageBgColor);
  const cardRgb = hexToRgbTheme(t.cardBgColor);
  const panelRgb = hexToRgbTheme(t.panelBgColor);
  const inputRgb = hexToRgbTheme(t.inputBgColor);

  const gradient = `linear-gradient(${t.gradientAngle}deg, ${t.primaryColor} 0%, ${t.secondaryColor} 100%)`;

  root.style.setProperty('--custom-primary', t.primaryColor);
  root.style.setProperty('--custom-secondary', t.secondaryColor);
  root.style.setProperty('--custom-gradient', gradient);

  root.style.setProperty('--custom-page-bg', t.pageBgColor);
  root.style.setProperty('--custom-page-bg-rgb', `${pageRgb.r}, ${pageRgb.g}, ${pageRgb.b}`);
  root.style.setProperty('--custom-page-bg-opacity', t.pageBgOpacity);

  root.style.setProperty('--custom-card-bg-rgb', `${cardRgb.r}, ${cardRgb.g}, ${cardRgb.b}`);
  root.style.setProperty('--custom-card-opacity', t.cardOpacity);

  root.style.setProperty('--custom-panel-bg-rgb', `${panelRgb.r}, ${panelRgb.g}, ${panelRgb.b}`);
  root.style.setProperty('--custom-panel-opacity', t.panelOpacity);

  root.style.setProperty('--custom-input-bg-rgb', `${inputRgb.r}, ${inputRgb.g}, ${inputRgb.b}`);
  root.style.setProperty('--custom-input-opacity', t.inputOpacity);

  root.style.setProperty('--custom-text', t.textColor);
  root.style.setProperty('--custom-subtext', t.subTextColor);

  root.style.setProperty('--custom-border', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.35)`);
  root.style.setProperty('--custom-radius', `${t.radius}px`);
  root.style.setProperty('--custom-shadow', `0 2px 12px rgba(0,0,0,${t.shadowOpacity})`);

  // 背景图 + 颜色遮罩
  if (t.pageBgImage) {
    body.classList.add('custom-theme-bg-image');
    body.style.backgroundImage = `
      linear-gradient(
        rgba(${pageRgb.r}, ${pageRgb.g}, ${pageRgb.b}, ${t.pageBgOpacity}),
        rgba(${pageRgb.r}, ${pageRgb.g}, ${pageRgb.b}, ${t.pageBgOpacity})
      ),
      url(${t.pageBgImage})
    `;
  } else {
    body.classList.remove('custom-theme-bg-image');
    body.style.backgroundImage = '';
  }
}

// ========== 设置页主题面板 ==========

function renderThemeCustomizePanel() {
  ensureThemeSettings();

  const box = document.getElementById('themeCustomizeBox');
  if (!box) return;

  const t = appData.themeSettings;

  box.innerHTML = `
    <div class="theme-custom-card">

      <div class="theme-block">
        <div class="theme-block-title">
          <span>总开关</span>
        </div>
        <div class="theme-row">
          <label>启用主题</label>
          <input type="checkbox" id="themeEnabled" ${t.enabled ? 'checked' : ''} onchange="updateThemeValue('enabled', this.checked)">
          <span style="font-size:12px;color:#888;">关闭后恢复原本粉蓝主题</span>
        </div>
      </div>

      <div class="theme-block">
        <div class="theme-block-title">
          <span>主渐变色</span>
        </div>

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
      </div>

      <div class="theme-block">
        <div class="theme-block-title">
          <span>页面背景</span>
        </div>

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

        <div class="theme-help">上传图片后，背景颜色会变成图片上的遮罩，可以用不透明度调节图片明显程度。</div>
      </div>

      <div class="theme-block">
        <div class="theme-block-title">
          <span>小卡片</span>
        </div>

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
      </div>

      <div class="theme-block">
        <div class="theme-block-title">
          <span>内部框 / 浅色块</span>
        </div>

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
      </div>

      <div class="theme-block">
        <div class="theme-block-title">
          <span>输入框</span>
        </div>

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
      </div>

      <div class="theme-block">
        <div class="theme-block-title">
          <span>文字颜色</span>
        </div>

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
      </div>

      <div class="theme-block">
        <div class="theme-block-title">
          <span>主题预览</span>
        </div>
        <div class="theme-preview-box">
          <div class="theme-preview-header"></div>
          <div class="theme-preview-card">
            <div class="theme-preview-line"></div>
            <div class="theme-preview-line short"></div>
          </div>
        </div>
      </div>

      <div class="theme-actions">
        <button class="theme-reset-btn" onclick="resetCustomTheme()">恢复默认</button>
        <button class="theme-save-btn" onclick="saveCustomTheme()">保存主题</button>
      </div>

    </div>
  `;
}

function updateThemeColor(key, value) {
  ensureThemeSettings();

  if (!isValidHexTheme(value)) {
    alert('请输入正确颜色，比如 #FFF0F5');
    renderThemeCustomizePanel();
    return;
  }

  appData.themeSettings[key] = value;
  saveData();
  applyCustomTheme();
  renderThemeCustomizePanel();
}

function updateThemeValue(key, value) {
  ensureThemeSettings();

  appData.themeSettings[key] = value;
  saveData();
  applyCustomTheme();
}

function updateThemeRange(key, value, textId, unit) {
  ensureThemeSettings();

  let num = parseFloat(value);

  if (key === 'gradientAngle' || key === 'radius') {
    num = parseInt(value);
  }

  appData.themeSettings[key] = num;

  const text = document.getElementById(textId);

  if (text) {
    if (unit === '%') {
      if (key === 'shadowOpacity') {
        text.textContent = Math.round(num * 100) + '%';
      } else {
        text.textContent = Math.round(num * 100) + '%';
      }
    } else {
      text.textContent = num + unit;
    }
  }

  saveData();
  applyCustomTheme();
}

function handleThemeBgUpload(e) {
  ensureThemeSettings();

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(ev) {
    appData.themeSettings.pageBgImage = ev.target.result;
    saveData();
    applyCustomTheme();
  };

  reader.readAsDataURL(file);
  e.target.value = '';
}

function clearThemeBgImage() {
  ensureThemeSettings();

  appData.themeSettings.pageBgImage = '';
  saveData();
  applyCustomTheme();
}

function saveCustomTheme() {
  saveData();
  applyCustomTheme();
  alert('✅ 主题已保存');
}

function resetCustomTheme() {
  if (!confirm('确定恢复默认粉蓝主题吗？')) return;

  appData.themeSettings = {
    enabled: true,

    primaryColor: '#FFB6C1',
    secondaryColor: '#87CEEB',
    gradientAngle: 135,

    pageBgColor: '#FFF0F5',
    pageBgOpacity: 1,
    pageBgImage: '',

    cardBgColor: '#FFFFFF',
    cardOpacity: 1,

    panelBgColor: '#FFF0F5',
    panelOpacity: 0.72,

    inputBgColor: '#FAFAFA',
    inputOpacity: 1,

    textColor: '#333333',
    subTextColor: '#888888',

    radius: 16,
    shadowOpacity: 0.08,
  };

  saveData();
  applyCustomTheme();
  renderThemeCustomizePanel();
}

// ========== 工具 ==========

function isValidHexTheme(color) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(color).trim());
}

function hexToRgbTheme(hex) {
  let clean = String(hex || '#FFFFFF').replace('#', '').trim();

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

// ========== 自动补丁：确保 renderAll 后主题不会被原背景设置覆盖 ==========
document.addEventListener('DOMContentLoaded', function() {
  ensureThemeSettings();
  applyCustomTheme();
  renderThemeCustomizePanel();

  if (typeof renderAll === 'function' && !window.__themeRenderAllPatched) {
    const oldRenderAll = renderAll;
    window.renderAll = function() {
      oldRenderAll();
      applyCustomTheme();
      renderThemeCustomizePanel();
    };
    window.__themeRenderAllPatched = true;
  }
});
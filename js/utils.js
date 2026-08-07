// ========== 工具函数 ==========
function formatMoney(n) {
  return '¥' + (Number(n) || 0).toFixed(2);
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function getCurrentCycleRange() {
  const now = new Date();
  const cycleStart = appData.settings.cycleStart || 1;
  let start, end;
  if (now.getDate() >= cycleStart) {
    start = new Date(now.getFullYear(), now.getMonth(), cycleStart);
    end = new Date(now.getFullYear(), now.getMonth() + 1, cycleStart - 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth() - 1, cycleStart);
    end = new Date(now.getFullYear(), now.getMonth(), cycleStart - 1);
  }
  return {
    start: start.getFullYear() + '-' + String(start.getMonth()+1).padStart(2,'0') + '-' + String(start.getDate()).padStart(2,'0'),
    end: end.getFullYear() + '-' + String(end.getMonth()+1).padStart(2,'0') + '-' + String(end.getDate()).padStart(2,'0')
  };
}

function isInCurrentCycle(dateStr) {
  const range = getCurrentCycleRange();
  return dateStr >= range.start && dateStr <= range.end;
}

function getCategoryIcon(cat) {
  const icons = {
    '餐饮': '🍔', '交通': '🚗', '购物': '🛒', '娱乐': '🎮', '医疗': '💊',
    '教育': '📚', '住房': '🏠', '通讯': '📱', '日用': '🧴', '服饰': '👗',
    '美妆': '💄', '运动': '⚽', '社交': '👥', '宠物': '🐱', '旅行': '✈️'
  };
  return icons[cat] || '💰';
}
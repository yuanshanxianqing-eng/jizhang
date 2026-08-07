// ========== 数据存储 ==========
const STORAGE_KEY = 'myPiggyBankData';

function getDefaultData() {
  return {
    settings: {
      title: '我的小金库 ♡',
      subtitle: '慢慢存钱，也慢慢变富',
      freeLabel: '♡ 自由支配余额',
      tags: ['日常', '聚餐', '交通', '购物'],
      salaryDay: 0,
      salaryText: '距离发工资',
      salaryIcon: '',
      initBalance: 0,
      cycleStart: 1,
      avatar: '',
      bgImage: '',
    },
    splash: {
      mainText: '我的小金库 ♡',
      subText: '慢慢存钱，也慢慢变富',
      animation: 'bubbles',
      duration: 3000,
    },
    budgetCategories: [],
    incomes: [],
    expenses: [],
    savings: [],
    savingGoals: [],
    presets: [],
    // ===== 新增：AI相关设置 =====
    aiSettings: {
      // API设置（key只存本地，不传前端代码，后端取环境变量）
      apiBaseUrl: '',
      apiModel: 'gpt-4o',
      // AI人设
      persona: {
        avatar: '',
        name: '小金',
        personality: '你是一个可爱温柔的记账小助手，会用轻松活泼的语气帮助用户记账，偶尔发表情包。',
        callUser: '主人',
      },
      // 表情包库（base64列表）
      stickers: [],
      // 转盘选项
      wheelOptions: ['买！', '不买！', '再想想', '犒劳自己', '存起来', '问问钱包'],
      // 对话框自定义
      chatCustomize: {
        bgImage: '',
        bgColor: '#FFF0F5',
        fontFamily: 'system',
        bubbleFontSize: 14,
      },
    },
  };
}

let appData = loadData();

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = getDefaultData();
      if (!parsed.settings) parsed.settings = def.settings;
      else {
        for (let k in def.settings) {
          if (parsed.settings[k] === undefined) parsed.settings[k] = def.settings[k];
        }
      }
      if (!parsed.splash) parsed.splash = def.splash;
      else {
        for (let k in def.splash) {
          if (parsed.splash[k] === undefined) parsed.splash[k] = def.splash[k];
        }
      }
      if (!parsed.budgetCategories) parsed.budgetCategories = [];
      if (!parsed.incomes) parsed.incomes = [];
      if (!parsed.expenses) parsed.expenses = [];
      if (!parsed.savings) parsed.savings = [];
      if (!parsed.savingGoals) parsed.savingGoals = [];
      if (!parsed.presets) parsed.presets = [];
      // 新增字段合并
      if (!parsed.aiSettings) parsed.aiSettings = def.aiSettings;
      else {
        for (let k in def.aiSettings) {
          if (parsed.aiSettings[k] === undefined) parsed.aiSettings[k] = def.aiSettings[k];
        }
        if (!parsed.aiSettings.persona) parsed.aiSettings.persona = def.aiSettings.persona;
        else {
          for (let k in def.aiSettings.persona) {
            if (parsed.aiSettings.persona[k] === undefined)
              parsed.aiSettings.persona[k] = def.aiSettings.persona[k];
          }
        }
        if (!parsed.aiSettings.stickers) parsed.aiSettings.stickers = [];
        if (!parsed.aiSettings.wheelOptions) parsed.aiSettings.wheelOptions = def.aiSettings.wheelOptions;
        if (!parsed.aiSettings.chatCustomize) parsed.aiSettings.chatCustomize = def.aiSettings.chatCustomize;
        else {
          for (let k in def.aiSettings.chatCustomize) {
            if (parsed.aiSettings.chatCustomize[k] === undefined)
              parsed.aiSettings.chatCustomize[k] = def.aiSettings.chatCustomize[k];
          }
        }
      }
      return parsed;
    }
  } catch(e) {}
  return getDefaultData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}
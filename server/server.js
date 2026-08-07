import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

const PORT = process.env.PORT || 3000;
const AI_BASE_URL = (process.env.AI_BASE_URL || '').replace(/\/$/, '');
const AI_API_KEY = process.env.AI_API_KEY || '';
const DEFAULT_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const CLIENT_API_TOKEN = process.env.CLIENT_API_TOKEN || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

app.use(cors({
  origin: ALLOWED_ORIGIN === '*'
    ? true
    : ALLOWED_ORIGIN.split(',').map(x => x.trim()).filter(Boolean),
}));

app.use(express.json({ limit: '30mb' }));

function requireServerConfig() {
  if (!AI_BASE_URL) {
    const err = new Error('Server missing AI_BASE_URL');
    err.status = 500;
    throw err;
  }

  if (!AI_API_KEY) {
    const err = new Error('Server missing AI_API_KEY');
    err.status = 500;
    throw err;
  }
}

function requireClientToken(req) {
  if (!CLIENT_API_TOKEN) return;

  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();

  if (token !== CLIENT_API_TOKEN) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
}

async function callChatCompletions(payload) {
  requireServerConfig();

  const resp = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();

  if (!resp.ok) {
    throw new Error(`AI HTTP ${resp.status}: ${text.slice(0, 800)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('AI returned non-JSON response');
  }
}

function extractJsonObject(text) {
  const raw = String(text || '').trim();

  try {
    return JSON.parse(raw);
  } catch {}

  const codeBlock = raw.match(/```json\s*([\s\S]*?)```/i) || raw.match(/```\s*([\s\S]*?)```/i);
  if (codeBlock) {
    try {
      return JSON.parse(codeBlock[1].trim());
    } catch {}
  }

  const objectMatch = raw.match(/\{[\s\S]*\}/);
  if (!objectMatch) return null;

  try {
    return JSON.parse(objectMatch[0]);
  } catch {
    return null;
  }
}

function normalizeReplies(value, fallback = '我处理好了。') {
  if (Array.isArray(value)) {
    return value.map(x => String(x || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [fallback];
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    amount: Number(item.amount) || 0,
    category: item.category || '',
    subCategory: item.subCategory || item.subcategory || '',
    tags: Array.isArray(item.tags)
      ? item.tags.map(x => String(x).trim()).filter(Boolean)
      : (item.tag ? [String(item.tag).trim()].filter(Boolean) : []),
    note: item.note || item.merchant || item.title || item.name || '',
    date: item.date || '',
    imageIndex: item.imageIndex ?? item.image_index ?? '',
    index,
  }));
}

function jsonError(res, err) {
  console.error('API ERROR:', err);

  res.status(err.status || 500).json({
    error: err.message || 'server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

function buildModel(model) {
  return String(model || DEFAULT_MODEL || '').trim();
}

function maybeJsonFormat() {
  // 大部分 OpenAI-compatible 中转站支持这个。
  // 如果你的中转站不支持 response_format，下面接口会自动重试一次不带它。
  return { type: 'json_object' };
}

async function callJsonChat(payload) {
  try {
    return await callChatCompletions({
      ...payload,
      response_format: maybeJsonFormat(),
    });
  } catch (err) {
    const msg = String(err.message || '');
    const mayBeResponseFormatIssue =
      msg.includes('response_format') ||
      msg.includes('json_object') ||
      msg.includes('unsupported') ||
      msg.includes('Unrecognized');

    if (!mayBeResponseFormatIssue) throw err;

    const retryPayload = { ...payload };
    delete retryPayload.response_format;
    return await callChatCompletions(retryPayload);
  }
}

app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'my-piggy-bank-ai-server',
    baseUrlConfigured: Boolean(AI_BASE_URL),
    apiKeyConfigured: Boolean(AI_API_KEY),
    clientTokenEnabled: Boolean(CLIENT_API_TOKEN),
    defaultModel: DEFAULT_MODEL,
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    requireClientToken(req);

    const {
      model,
      messages,
      message,
      persona,
      stickerNotes,
      replySettings,
      history,
      instruction,
      max_tokens,
      temperature,
      test,
    } = req.body || {};

    const userText = Array.isArray(messages)
      ? messages.map(m => typeof m === 'string' ? m : m.content || '').join('\n')
      : String(message || '');

    const system = [
      persona?.personality || '你是一个温柔实用的记账助手。',
      persona?.name ? `你的名字是：${persona.name}。` : '',
      persona?.callUser ? `你称呼用户为：${persona.callUser}。` : '',
      '请用中文回复。',
      instruction || '',
      stickerNotes?.length ? `可用表情包备注：${stickerNotes.join('、')}` : '',
      replySettings ? `回复设置：${JSON.stringify(replySettings)}` : '',
    ].filter(Boolean).join('\n');

    const aiMessages = [
      { role: 'system', content: system },
      ...(Array.isArray(history) ? history.slice(-20) : []),
      { role: 'user', content: test ? '请只回复：连接成功' : userText },
    ];

    const data = await callChatCompletions({
      model: buildModel(model),
      messages: aiMessages,
      temperature: temperature ?? 0.6,
      max_tokens: max_tokens || 600,
    });

    const content = data.choices?.[0]?.message?.content || '';

    if (test) {
      return res.json({
        ok: true,
        replies: [content || '连接成功'],
        message: content || '连接成功',
      });
    }

    const parsed = extractJsonObject(content);

    if (parsed && (parsed.replies || parsed.reply || parsed.items || parsed.stickerNotes)) {
      return res.json({
        replies: normalizeReplies(parsed.replies || parsed.reply, content || '我收到啦。'),
        items: normalizeItems(parsed.items),
        stickerNotes: Array.isArray(parsed.stickerNotes) ? parsed.stickerNotes : [],
      });
    }

    res.json({
      replies: [content || '我收到啦。'],
      items: [],
      stickerNotes: [],
    });
  } catch (err) {
    jsonError(res, err);
  }
});

app.post('/api/ai/parse-expense', async (req, res) => {
  try {
    requireClientToken(req);

    const {
      model,
      text,
      categories = [],
      tags = [],
      persona,
    } = req.body || {};

    const system = `
你是记账解析助手。请从用户文本里提取消费记录。
必须只返回 JSON，不要 Markdown，不要解释。

返回格式：
{
  "replies": ["简短中文回复"],
  "items": [
    {
      "amount": 35,
      "category": "餐饮",
      "subCategory": "午餐",
      "tags": ["日常"],
      "note": "午饭",
      "date": "YYYY-MM-DD"
    }
  ]
}

规则：
1. 一句话里可能有多笔消费，请拆成多条 items。
2. category 优先从用户已有分类中选择。
3. subCategory 优先从对应二级分类中选择。
4. tags 只能从用户已有标签中选择。
5. 不确定的字段留空。
6. 金额必须是数字。
7. 日期不确定就留空，由前端补今天。
8. 不要把收入当成支出，除非用户明确说是消费/花费/付款。

用户分类：${JSON.stringify(categories)}
用户标签：${JSON.stringify(tags)}
AI人设：${JSON.stringify(persona || {})}
`.trim();

    const data = await callJsonChat({
      model: buildModel(model),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: String(text || '') },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = extractJsonObject(content) || {};

    res.json({
      replies: normalizeReplies(parsed.replies || parsed.reply, '我帮你整理好了。'),
      items: normalizeItems(parsed.items),
    });
  } catch (err) {
    jsonError(res, err);
  }
});

app.post('/api/ai/recognize-receipt', async (req, res) => {
  try {
    requireClientToken(req);

    const {
      model,
      images = [],
      categories = [],
      tags = [],
      instruction = '',
      source = '',
      stickerNotes = [],
    } = req.body || {};

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'images required' });
    }

    const system = `
你是账单图片识别助手。请识别图片里的消费账单、付款截图、订单截图、票据。
必须只返回 JSON，不要 Markdown，不要解释。

返回格式：
{
  "replies": ["简短中文回复"],
  "items": [
    {
      "amount": 35,
      "category": "餐饮",
      "subCategory": "午餐",
      "tags": ["日常"],
      "note": "商家或商品",
      "date": "YYYY-MM-DD",
      "imageIndex": 0
    }
  ],
  "stickerNotes": []
}

规则：
1. 一张图片里可能有多笔账单，请逐条拆分到 items，不要合并金额。
2. 多张图片时，用 imageIndex 标记来自第几张图片，从 0 开始。
3. category 必须优先使用用户已有一级分类。
4. subCategory 必须优先使用对应二级分类。
5. tags 只能从用户已有标签中选择。
6. 不确定的字段留空。
7. 金额必须是数字。
8. 日期不确定就留空，由前端补今天。
9. 只识别支出账单，不要把余额、优惠、积分当成消费金额。

用户分类：${JSON.stringify(categories)}
用户标签：${JSON.stringify(tags)}
来源：${source}
额外要求：${instruction}
可用表情包备注：${JSON.stringify(stickerNotes)}
`.trim();

    const userContent = [
      { type: 'text', text: '请识别这些图片里的账单，并按 JSON 格式返回。' },
      ...images.map(url => ({
        type: 'image_url',
        image_url: { url },
      })),
    ];

    const data = await callJsonChat({
      model: buildModel(model),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 1800,
    });

    const aiText = data.choices?.[0]?.message?.content || '{}';
    const parsed = extractJsonObject(aiText) || {};

    res.json({
      replies: normalizeReplies(parsed.replies || parsed.reply, '我识别完啦。'),
      items: normalizeItems(parsed.items),
      stickerNotes: Array.isArray(parsed.stickerNotes) ? parsed.stickerNotes : [],
    });
  } catch (err) {
    jsonError(res, err);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`AI server running on http://localhost:${PORT}`);
    console.log(`AI base url: ${AI_BASE_URL || '(missing)'}`);
    console.log(`Default model: ${DEFAULT_MODEL || '(missing)'}`);
    console.log(`Client token enabled: ${Boolean(CLIENT_API_TOKEN)}`);
  });
}

export default app;
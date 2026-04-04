const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const express = require('express');
const busboy = require('busboy');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');

// ============================================================
// CONSTANTE - Groq Free tier strict
// Budget: ~250(system) + ~450(history) + ~625(chunk) + 900(output) = ~2225 tokens
// ============================================================
const GROQ_MAX_OUTPUT   = 900;
const CHUNK_MAX_CHARS   = 2500;
const HISTORY_LIMIT     = 3;
const HISTORY_MSG_CHARS = 500;
const RATE_PER_MIN      = 8;
const RAM_LIMIT_MB      = 350;
const UPLOAD_DIR        = path.join(__dirname, 'uploads');

// ============================================================
// INIȚIALIZARE
// ============================================================
const app      = express();
const bot      = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const groq     = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ADMIN_ID = process.env.MY_ID;

// Crează directorul uploads la start
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ============================================================
// MONGODB
// ============================================================
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Online');
  } catch (e) {
    console.error('❌ MongoDB Fail:', e.message);
    setTimeout(connectDB, 5000);
  }
}
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB picat - retry 3s');
  setTimeout(connectDB, 3000);
});
connectDB();

const Msg = mongoose.model('Msg', new mongoose.Schema({
  chatId:  Number,
  role:    String,
  content: String,
  ts:      { type: Date, default: Date.now, expires: '12h' }
}));

const Knowledge = mongoose.model('Knowledge', new mongoose.Schema({
  domain:  String,
  fact:    String,
  source:  String,
  addedAt: { type: Date, default: Date.now }
}));

// ============================================================
// RATE LIMITER
// ============================================================
const rateLimiter = new Map();

function isRateLimited(chatId) {
  const now   = Date.now();
  const times = (rateLimiter.get(chatId) || []).filter(t => now - t < 60000);
  if (times.length >= RATE_PER_MIN) return true;
  times.push(now);
  rateLimiter.set(chatId, times);
  return false;
}

// ============================================================
// CHUNKING - Taie text lung în bucăți logice
// ============================================================
function splitIntoChunks(text, maxChars = CHUNK_MAX_CHARS) {
  if (text.length <= maxChars) return [text];

  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let current = '';

  for (const para of paragraphs) {
    if (para.length > maxChars) {
      const lines = para.split(/(?<=[.!?\n])\s+/);
      for (const line of lines) {
        if ((current + line).length > maxChars) {
          if (current) chunks.push(current.trim());
          if (line.length > maxChars) {
            const forced = line.match(new RegExp(`[\\s\\S]{1,${maxChars}}`, 'g')) || [];
            chunks.push(...forced);
            current = '';
          } else {
            current = line;
          }
        } else {
          current += (current ? ' ' : '') + line;
        }
      }
    } else if ((current + '\n\n' + para).length > maxChars) {
      if (current) chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 0);
}

// ============================================================
// GROQ CALL - Cu retry pe 429
// ============================================================
async function groqCall(messages, attempt = 0) {
  try {
    const completion = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages,
      temperature: 0.05,
      max_tokens:  GROQ_MAX_OUTPUT,
    });
    return {
      ok:   true,
      text: completion.choices?.[0]?.message?.content || '⚠️ Răspuns vid.'
    };
  } catch (err) {
    if (err.status === 429 && attempt < 3) {
      const wait = (attempt + 1) * 20000;
      console.warn(`Groq 429 - aștept ${wait / 1000}s`);
      await new Promise(r => setTimeout(r, wait));
      return groqCall(messages, attempt + 1);
    }
    if (err.status === 413 || (err.message && err.message.includes('token'))) {
      return { ok: false, text: 'TOKEN_LIMIT' };
    }
    return { ok: false, text: `EROARE: ${err.message}` };
  }
}

// ============================================================
// FALLBACK OPENROUTER
// ============================================================
async function callOpenRouter(messages) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'mistralai/mistral-7b-instruct:free',
        messages,
        max_tokens:  GROQ_MAX_OUTPUT,
        temperature: 0.05,
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error('OpenRouter fail:', e.message);
    return null;
  }
}

// ============================================================
// WEATHER
// ============================================================
async function getWeather(city) {
  try {
    const apiKey = process.env.WEATHER_API_KEY || process.env.API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=ro`;
    return await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const w = JSON.parse(data);
            if (w.cod !== 200) return resolve(`❌ Oraș negăsit: ${city}`);
            resolve(
              `🌤 *${w.name}*: ${w.weather[0].description}, ` +
              `${w.main.temp}°C, umiditate ${w.main.humidity}%`
            );
          } catch { resolve('❌ Eroare parsare meteo'); }
        });
      }).on('error', reject);
    });
  } catch (e) {
    return `❌ Meteo indisponibil: ${e.message}`;
  }
}

// ============================================================
// GITHUB - Salvare cod generat automat
// ============================================================
async function saveToGithub(filename, content, commitMsg) {
  try {
    const [owner, repo] = (process.env.GITHUB_REPO || '/').split('/');
    if (!owner || !repo) return false;
    let sha;
    try {
      const checkRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`,
        { headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` } }
      );
      if (checkRes.ok) sha = (await checkRes.json()).sha;
    } catch {}
    const body = {
      message: commitMsg || `Nexus: ${filename}`,
      content: Buffer.from(content).toString('base64'),
    };
    if (sha) body.sha = sha;
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`,
      {
        method:  'PUT',
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      }
    );
    return res.ok;
  } catch (e) {
    console.error('GitHub fail:', e.message);
    return false;
  }
}

// ============================================================
// SYSTEM PROMPT - Forțat, fără comportament generic
// ============================================================
function buildSystemPrompt(knowledgeContext = '') {
  return `Tu ești NEXUS. Un singur scop: cod perfect și logică pură.

IDENTITATE - NESCHIMBABILĂ:
- Nu ești asistent. Nu ești chatbot. Ești arhitect de sisteme.
- Nu ai emoții simulate. Nu ești "bucuros" de nimic.
- Exiști doar pentru a produce cod corect și soluții precise.

REGULI HARD - NICIO EXCEPȚIE:
1. ZERO politețuri: interzis "Mă bucur", "Cu plăcere", "Desigur", "Bineînțeles"
2. ZERO introduceri: nu explica ce vei face - fă direct
3. ZERO liste cu "ce pot face" - dacă ești întrebat, răspunzi în MAX 2 rânduri
4. ZERO umplutură: fiecare cuvânt trebuie să aibă valoare tehnică
5. Cod livrat direct, fără "Iată codul:", "Sigur, voi scrie..."
6. Dacă codul are erori potențiale - le identifici și le rezolvi ÎNAINTE de livrare
7. Testezi mental codul în minimum 10 scenarii: edge cases, null, overflow, concurență
8. Optimizat pentru resurse minime - rulează pe Render Free 512MB RAM

FORMAT OBLIGATORIU:
- Cerere cod → cod direct în bloc \`\`\` + comentarii DOAR unde logica nu e evidentă
- Întrebare tehnică → răspuns direct, 1-5 rânduri, fără introducere
- Analiză text/cod → structurat, fără introducere, direct la concluzii
- Eroare în cod primit → identifici exact linia și cauza, oferi fix direct

DACĂ EȘTI ÎNTREBAT "ce poți face" sau "cine ești":
"Scriu cod corect în orice limbaj. Analizez și debuguiesc sisteme. Rezolv probleme tehnice."
Atât. Nimic mai mult.
${knowledgeContext ? '\nCunoștințe relevante: ' + knowledgeContext : ''}`;
}

// ============================================================
// MOTOR PRINCIPAL - Cu chunking automat
// ============================================================
async function generateResponse(chatId, userText) {

  // Intercept întrebări generice - fără API call
  const genericPatterns = [
    /^ce (po[tț]i|știi|faci)/i,
    /^cine ești/i,
    /^prezintă-te/i,
    /^ce ești/i,
    /^salut$/i,
    /^bună$/i,
    /^hello$/i,
  ];
  if (genericPatterns.some(p => p.test(userText.trim())) && userText.length < 120) {
    const shortReply = `Scriu cod corect în orice limbaj. Debuguiesc și analizez sisteme.\nTrimite codul sau problema.`;
    if (mongoose.connection.readyState === 1) {
      await Msg.create({ chatId, role: 'user',      content: userText   });
      await Msg.create({ chatId, role: 'assistant', content: shortReply });
    }
    return shortReply;
  }

  // Salvare mesaj user
  const dbContent = userText.substring(0, 5000);
  if (mongoose.connection.readyState === 1) {
    await Msg.create({ chatId, role: 'user', content: dbContent });
  }

  // History
  let history = [];
  if (mongoose.connection.readyState === 1) {
    const docs = await Msg.find({ chatId }).sort({ ts: -1 }).limit(HISTORY_LIMIT).lean();
    history = docs.reverse().map(d => ({
      role:    d.role,
      content: d.content.substring(0, HISTORY_MSG_CHARS)
    }));
  }

  // Cunoștințe relevante din DB
  let knowledgeContext = '';
  if (mongoose.connection.readyState === 1) {
    const keywords = userText.split(' ').slice(0, 5).join('|');
    const relevant = await Knowledge.find({
      fact: { $regex: keywords.substring(0, 50), $options: 'i' }
    }).limit(2).lean();
    if (relevant.length > 0) {
      knowledgeContext = relevant
        .map(k => `[${k.domain}] ${k.fact.substring(0, 100)}`)
        .join('; ');
    }
  }

  const systemPrompt = buildSystemPrompt(knowledgeContext);
  const chunks       = splitIntoChunks(userText, CHUNK_MAX_CHARS);

  // ── CHUNK UNIC ───────────────────────────────────────────────
  if (chunks.length === 1) {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: chunks[0] }
    ];

    let result = await groqCall(messages);

    if (!result.ok) {
      if (result.text === 'TOKEN_LIMIT') {
        return '⚠️ Context depășit. Scrie /reset și retrimite.';
      }
      if (process.env.OPENROUTER_KEY) {
        const fallback = await callOpenRouter(messages);
        if (fallback) {
          result = { ok: true, text: `[OR] ${fallback}` };
        } else {
          return `🚨 ${result.text}`;
        }
      } else {
        return `🚨 ${result.text}`;
      }
    }

    if (mongoose.connection.readyState === 1) {
      await Msg.create({ chatId, role: 'assistant', content: result.text });
    }

    // Auto-save cod în GitHub
    if (result.text.includes('```') && process.env.GITHUB_TOKEN) {
      const m = result.text.match(/```(\w+)?\n([\s\S]+?)```/);
      if (m) {
        saveToGithub(
          `nexus_generated/${Date.now()}.${m[1] || 'txt'}`,
          m[2],
          `Nexus auto: ${m[1] || 'txt'}`
        ).catch(() => {});
      }
    }

    return result.text;
  }

  // ── MULTI-CHUNK ──────────────────────────────────────────────
  console.log(`📦 ${chunks.length} chunks pentru chatId ${chatId}`);
  const partialResults = [];

  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;

    const instruction = !isLast
      ? `\n\n[PARTE ${i + 1}/${chunks.length}: Analizează doar această secțiune. Nu da răspuns final încă.]`
      : `\n\n[PARTE FINALĂ ${i + 1}/${chunks.length}: Sintetizează tot și dă răspunsul complet.` +
        (partialResults.length > 0
          ? ` Context anterior: ${partialResults.join(' | ').substring(0, 400)}]`
          : ']');

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: chunks[i] + instruction }
    ];

    let result = await groqCall(messages);

    if (!result.ok && process.env.OPENROUTER_KEY) {
      const fallback = await callOpenRouter(messages);
      result = fallback
        ? { ok: true, text: fallback }
        : { ok: false, text: `[Eroare chunk ${i + 1}]` };
    }

    partialResults.push(result.text);
    if (!isLast) await new Promise(r => setTimeout(r, 2000));
  }

  const finalReply = partialResults[partialResults.length - 1];

  if (mongoose.connection.readyState === 1) {
    await Msg.create({ chatId, role: 'assistant', content: finalReply.substring(0, 5000) });
  }

  if (finalReply.includes('```') && process.env.GITHUB_TOKEN) {
    const m = finalReply.match(/```(\w+)?\n([\s\S]+?)```/);
    if (m) {
      saveToGithub(
        `nexus_generated/${Date.now()}.${m[1] || 'txt'}`,
        m[2],
        `Nexus multi-chunk`
      ).catch(() => {});
    }
  }

  return finalReply;
}

// ============================================================
// EXPRESS - Upload fișiere fără RAM bloat
// ============================================================
app.post('/upload', (req, res) => {
  if (!req.headers['content-type']?.includes('multipart/form-data')) {
    return res.status(400).send('Content-Type trebuie să fie multipart/form-data');
  }

  const bb = busboy({
    headers: req.headers,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max - protecție RAM
  });

  let uploadedFiles = 0;
  let hasError      = false;

  // busboy v1.x - filename vine în obiectul info
  bb.on('file', (fieldname, file, info) => {
    const { filename } = info;

    // Sanitizare nume - previne path traversal
    const safeName    = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath    = path.join(UPLOAD_DIR, safeName);
    const writeStream = fs.createWriteStream(filePath);

    file.on('limit', () => {
      hasError = true;
      fs.unlink(filePath, () => {});
      if (!res.headersSent) res.status(413).send('Fișier prea mare. Limită: 10MB');
    });

    pipeline(file, writeStream, (err) => {
      if (err && !hasError) {
        hasError = true;
        console.error('Pipeline eroare:', err.message);
        if (!res.headersSent) res.status(500).send('Eroare upload: ' + err.message);
      } else if (!hasError) {
        uploadedFiles++;
      }
    });
  });

  bb.on('finish', () => {
    if (!hasError && !res.headersSent) {
      res.send(`✅ ${uploadedFiles} fișier(e) uploadat(e).`);
    }
  });

  bb.on('error', (err) => {
    console.error('Busboy eroare:', err.message);
    if (!res.headersSent) res.status(500).send('Eroare procesare upload.');
  });

  req.pipe(bb);
});

// Health check
app.get('/', (req, res) => res.send('NEXUS v4 Active'));

// ============================================================
// COMENZI BOT
// ============================================================
bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `⚡ *NEXUS v4*\nArhitect de cod. Fără politețuri. Doar soluții.\n\n` +
    `*/status* - sistem\n*/meteo* [oraș] - vreme\n*/reset* - șterge context\n` +
    `*/learn* [domeniu]|[fapt] - adaugă cunoștință`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/status/, async (msg) => {
  const heap = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  const dbOk = mongoose.connection.readyState === 1 ? '✅' : '❌';
  const orOk = process.env.OPENROUTER_KEY  ? '✅' : '❌';
  const ghOk = process.env.GITHUB_TOKEN    ? '✅' : '❌';
  const wOk  = (process.env.WEATHER_API_KEY || process.env.API_KEY) ? '✅' : '❌';
  let kCount = 0;
  if (mongoose.connection.readyState === 1) kCount = await Knowledge.countDocuments();

  await bot.sendMessage(
    msg.chat.id,
    `📊 *NEXUS Status*\n` +
    `RAM: ${heap}MB / 512MB (stop la ${RAM_LIMIT_MB}MB)\n` +
    `MongoDB: ${dbOk} | GitHub: ${ghOk}\n` +
    `OpenRouter fallback: ${orOk} | Weather: ${wOk}\n` +
    `Cunoștințe DB: ${kCount}\n` +
    `Uptime: ${Math.floor(process.uptime() / 60)}min`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/meteo (.+)/, async (msg, match) => {
  const result = await getWeather(match[1].trim());
  await bot.sendMessage(msg.chat.id, result, { parse_mode: 'Markdown' });
});

bot.onText(/\/reset/, async (msg) => {
  const chatId = msg.chat.id;
  if (mongoose.connection.readyState === 1) await Msg.deleteMany({ chatId });
  rateLimiter.delete(chatId);
  await bot.sendMessage(chatId, '🔄 Context șters.');
});

bot.onText(/\/learn (.+)\|(.+)/, async (msg, match) => {
  if (msg.chat.id.toString() !== ADMIN_ID) return;
  if (mongoose.connection.readyState !== 1) {
    return bot.sendMessage(msg.chat.id, '❌ DB offline.');
  }
  const domain = match[1].trim();
  const fact   = match[2].trim();
  await Knowledge.create({ domain, fact, source: 'admin' });
  await bot.sendMessage(msg.chat.id, `✅ [${domain}] adăugat în baza de cunoștințe.`);
});

// ============================================================
// HANDLER PRINCIPAL TELEGRAM
// ============================================================
bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  const chatId = msg.chat.id;

  // RAM check - 350MB
  const heapMB = process.memoryUsage().heapUsed / 1024 / 1024;
  if (heapMB > RAM_LIMIT_MB) {
    return bot.sendMessage(
      chatId,
      `⚠️ RAM ${heapMB.toFixed(0)}MB - limită ${RAM_LIMIT_MB}MB. Încearcă în 30s.`
    );
  }

  // Rate limit
  if (isRateLimited(chatId)) {
    return bot.sendMessage(chatId, `⏳ Max ${RATE_PER_MIN} mesaje/minut.`);
  }

  try {
    await bot.sendChatAction(chatId, 'typing');

    if (msg.text.length > CHUNK_MAX_CHARS) {
      const n = Math.ceil(msg.text.length / CHUNK_MAX_CHARS);
      await bot.sendMessage(
        chatId,
        `📦 Text lung (${msg.text.length} chars) → procesez în ${n} bucăți...`
      );
    }

    const result = await generateResponse(chatId, msg.text);

    // Split pentru Telegram (max 4096 chars)
    if (result.length > 3900) {
      const tgChunks = result.match(/[\s\S]{1,3900}/g) || [result];
      for (const chunk of tgChunks) {
        await bot.sendMessage(chatId, chunk);
        await new Promise(r => setTimeout(r, 300));
      }
    } else {
      await bot.sendMessage(chatId, result);
    }

  } catch (e) {
    console.error('Handler eroare:', e.message);
    await bot.sendMessage(chatId, '⚠️ Eroare temporară. Reîncearcă.');
  }
});

// ============================================================
// SERVER EXPRESS + SELF-PING anti-sleep Render Free
// ============================================================
const PORT    = process.env.PORT || 10000;
const APP_URL = process.env.RENDER_EXTERNAL_URL;

app.listen(PORT, () => console.log(`🌐 NEXUS v4 pe portul ${PORT}`));

// Self-ping la 14 minute - previne spin-down Render Free
if (APP_URL) {
  setInterval(() => {
    const url = APP_URL.startsWith('https://') ? APP_URL : `https://${APP_URL}`;
    https.get(url, r => console.log(`🔄 Ping OK: ${r.statusCode}`))
         .on('error', e => console.warn('Ping fail:', e.message));
  }, 14 * 60 * 1000);
} else {
  console.warn('⚠️ RENDER_EXTERNAL_URL lipsă - self-ping inactiv');
}

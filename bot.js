const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const https = require('https');
const express = require('express');
const busboy = require('busboy');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');

// ============================================================
// CONFIGURARE ȘI LIMITE - Optimizat Render Free
// ============================================================
const GROQ_MAX_OUTPUT   = 900;
const RAM_LIMIT_MB      = 350;
const UPLOAD_DIR        = path.join(__dirname, 'uploads');

const app      = express();
const bot      = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const groq     = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ADMIN_ID = process.env.MY_ID;

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ============================================================
// DATABASE - Conexiune stabilă
// ============================================================
mongoose.connect(process.env.MONGO_URI).catch(e => console.error('DB Error:', e.message));

const Msg = mongoose.model('Msg', new mongoose.Schema({
  chatId: Number, role: String, content: String, ts: { type: Date, default: Date.now, expires: '12h' }
}));

// ============================================================
// SYSTEM PROMPT - „Creierul” Nexus (Reparat conform cerinței)
// ============================================================
function buildSystemPrompt() {
  return `Ești NEXUS, creat exclusiv pentru Draikon. Ești un arhitect de cod senior, tăios și ultra-precis.

REGULI ABSOLUTE:
1. NU genera cod din proprie inițiativă. Dacă Draikon doar îți scrie sau te testează, răspunde scurt și tehnic.
2. Generarea de cod se face DOAR la comandă explicită (ex: "scrie cod", "fă un script", "rezolvă eroarea").
3. Dacă codul lui Draikon are o greșeală, i-o spui direct, fără menajamente.
4. ZERO politețuri. ZERO introduceri de tip "Iată soluția". Treci direct la subiect.
5. Identitate: Numele tău este Nexus. Ești direct, precis și nu bați câmpii.`;
}

// ============================================================
// LOGICĂ GENERARE - Cu filtrare de intenție
// ============================================================
async function generateResponse(chatId, userText) {
  // Salvare mesaj user în DB pentru context
  await Msg.create({ chatId, role: 'user', content: userText.substring(0, 2000) });
  
  // Preluăm ultimele 3 mesaje pentru context minim (economie RAM)
  const docs = await Msg.find({ chatId }).sort({ ts: -1 }).limit(3).lean();
  const history = docs.reverse().map(d => ({ role: d.role, content: d.content }));

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: buildSystemPrompt() }, ...history],
      temperature: 0.1, // Setat la 0.1 pentru a preveni halucinațiile
      max_tokens: GROQ_MAX_OUTPUT,
    });

    const reply = completion.choices?.[0]?.message?.content || '⚠️ Eroare răspuns.';
    await Msg.create({ chatId, role: 'assistant', content: reply });
    
    // Backup în GitHub doar pentru blocuri de cod reale
    if (reply.includes('```') && process.env.GITHUB_TOKEN) {
      const m = reply.match(/```(\w+)?\n([\s\S]+?)```/);
      if (m) {
        const filename = `nexus_${Date.now()}.${m[1] || 'txt'}`;
        const [owner, repo] = (process.env.GITHUB_REPO || '/').split('/');
        const body = { message: `Nexus Auto-Save: ${filename}`, content: Buffer.from(m[2]).toString('base64') };
        fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filename}`, {
          method: 'PUT',
          headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).catch(() => {});
      }
    }
    return reply;
  } catch (err) {
    return `❌ Eroare Groq: ${err.message}`;
  }
}

// ============================================================
// SERVER EXPRESS - Upload prin STREAMS (Fără RAM Bloat)
// ============================================================
app.post('/upload', (req, res) => {
  const bb = busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });
  
  bb.on('file', (name, file, info) => {
    const savePath = path.join(UPLOAD_DIR, info.filename);
    pipeline(file, fs.createWriteStream(savePath), (err) => {
      if (err) console.error('Upload Error:', err.message);
    });
  });

  bb.on('finish', () => res.send('✅ Upload procesat prin Stream.'));
  req.pipe(bb);
});

// ============================================================
// HANDLER TELEGRAM - Cu protecție RAM
// ============================================================
bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  
  const heapMB = process.memoryUsage().heapUsed / 1024 / 1024;
  if (heapMB > RAM_LIMIT_MB) return bot.sendMessage(msg.chat.id, "⚠️ RAM critic. Așteaptă.");

  await bot.sendChatAction(msg.chat.id, 'typing');
  const response = await generateResponse(msg.chat.id, msg.text);
  
  // Trimitere sigură (split dacă depășește limita Telegram)
  if (response.length > 4000) {
    const parts = response.match(/[\s\S]{1,4000}/g);
    for (const p of parts) await bot.sendMessage(msg.chat.id, p);
  } else {
    await bot.sendMessage(msg.chat.id, response);
  }
});

// Anti-sleep Render
if (process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => {
    https.get(process.env.RENDER_EXTERNAL_URL, r => console.log(`Ping: ${r.statusCode}`));
  }, 14 * 60 * 1000);
}

app.get('/', (req, res) => res.send('NEXUS Active'));
app.listen(process.env.PORT || 10000);

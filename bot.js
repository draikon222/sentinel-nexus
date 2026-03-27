const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const http = require('http');
const https = require('https');

// ── ENV ──────────────────────────────────────────────────────────────────────
const token    = process.env.TELEGRAM_TOKEN;
const mongoUri = process.env.MONGO_URI;
const groqKey  = process.env.GROQ_API_KEY;
const selfUrl  = process.env.RENDER_EXTERNAL_URL; // ex: https://sentinel-nexus.onrender.com

// ── GROQ ─────────────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: groqKey });

// ── MONGOOSE – schema memorie conversație ────────────────────────────────────
const msgSchema = new mongoose.Schema({
  chatId:  { type: Number, index: true },
  role:    String,   // 'user' | 'assistant'
  content: String,
  ts:      { type: Date, default: Date.now }
});
const Msg = mongoose.model('Msg', msgSchema);

mongoose.connect(mongoUri)
  .then(() => console.log('✅ DB Conectat'))
  .catch(err => console.error('❌ DB eroare:', err));

// ── BOT ───────────────────────────────────────────────────────────────────────
const bot = new TelegramBot(token, { polling: true });

bot.deleteWebHook({ drop_pending_updates: true })
   .then(() => console.log('✅ Nexus pornit.'));

// ── HELPER: construiește istoricul din DB (ultimele 20 mesaje) ────────────────
async function getHistory(chatId) {
  const docs = await Msg.find({ chatId }).sort({ ts: -1 }).limit(20).lean();
  return docs.reverse().map(d => ({ role: d.role, content: d.content }));
}

// ── HANDLER TEXT ──────────────────────────────────────────────────────────────
async function handleText(chatId, userText) {
  // Salvăm mesajul userului
  await Msg.create({ chatId, role: 'user', content: userText });

  // Luăm istoricul
  const history = await getHistory(chatId);

  // Trimitem la Groq
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: 'Ești Sentinel Nexus, un asistent AI inteligent și prietenos. Răspunzi clar și concis.'
      },
      ...history
    ],
    max_tokens: 1024
  });

  const reply = completion.choices[0].message.content;

  // Salvăm răspunsul
  await Msg.create({ chatId, role: 'assistant', content: reply });

  return reply;
}

// ── EVENIMENT: orice mesaj ────────────────────────────────────────────────────
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // /start
  if (msg.text && msg.text.startsWith('/start')) {
    return bot.sendMessage(chatId,
      '👋 Salut! Sunt *Sentinel Nexus*. Scrie-mi orice mesaj și îți răspund!',
      { parse_mode: 'Markdown' }
    );
  }

  // /reset – șterge istoricul
  if (msg.text && msg.text.startsWith('/reset')) {
    await Msg.deleteMany({ chatId });
    return bot.sendMessage(chatId, '🔄 Conversația a fost resetată.');
  }

  // Mesaj text normal
  if (msg.text) {
    try {
      await bot.sendChatAction(chatId, 'typing');
      const reply = await handleText(chatId, msg.text);
      return bot.sendMessage(chatId, reply);
    } catch (err) {
      console.error('❌ Eroare text:', err.message);
      return bot.sendMessage(chatId, '⚠️ Ceva a mers prost. Încearcă din nou.');
    }
  }

  // Fotografie
  if (msg.photo) {
    return bot.sendMessage(chatId,
      '📸 Am primit poza ta! Deocamdată nu pot analiza imagini, dar pot răspunde la orice text.'
    );
  }

  // Orice alt tip (sticker, voice, etc.)
  bot.sendMessage(chatId, '🤖 Pot răspunde doar la mesaje text momentan. Scrie-mi ceva!');
});

// ── SERVER HTTP (obligatoriu Render) + SELF-PING anti-sleep ──────────────────
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Nexus Alive ✅');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`✅ Server pe portul ${PORT}`));

// Self-ping la fiecare 4 minute ca să nu adoarmă instanța
if (selfUrl) {
  setInterval(() => {
    https.get(selfUrl, (res) => {
      console.log(`🔔 Self-ping: ${res.statusCode}`);
    }).on('error', (err) => {
      console.log('⚠️ Self-ping eșuat:', err.message);
    });
  }, 4 * 60 * 1000); // 4 minute
}

// ── ANTI-CRASH ────────────────────────────────────────────────────────────────
process.on('uncaughtException',   (err) => console.error('💥 UncaughtException:', err.message));
process.on('unhandledRejection',  (err) => console.error('💥 UnhandledRejection:', err));

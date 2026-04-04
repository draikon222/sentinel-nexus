const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const fs = require('fs');

// --- CONEXIUNI ---
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('✅ Nexus DB Online'))
  .catch(e => console.error('❌ DB Error:', e.message));

const Msg = mongoose.model('Msg', new mongoose.Schema({
  chatId: Number, role: String, content: String, ts: { type: Date, default: Date.now, expires: '24h' }
}));

// --- LOGICA DE AUTO-PATCH (Să nu te mai atingi de cod) ---
bot.onText(/\/patch (.+)/s, async (msg, match) => {
  try {
    fs.writeFileSync(__filename, match[1]);
    await bot.sendMessage(msg.chat.id, "🚀 Nucleu rescris cu succes. Restarting...");
    process.exit(0); // Render îl repornește automat
  } catch (e) { await bot.sendMessage(msg.chat.id, "💥 Patch Failed: " + e.message); }
});

// --- PROCESARE (ANTI-CRASH 512MB + GROQ 6000 TPM) ---
async function handleText(chatId, userText) {
  try {
    const input = userText.substring(0, 3000); // Limităm input să nu treacă de 6000 tokeni cu tot cu istoric
    await Msg.create({ chatId, role: 'user', content: input });

    const historyDocs = await Msg.find({ chatId }).sort({ ts: -1 }).limit(6).lean();
    const history = historyDocs.reverse().map(d => ({ role: d.role, content: d.content }));

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: 'Nume: Nexus. Creatori: Broo & Ana. Logică tăioasă.' }, ...history],
      max_tokens: 800
    });

    const reply = completion.choices[0]?.message?.content || "Eroare: Groq vid.";
    await Msg.create({ chatId, role: 'assistant', content: reply });
    return reply;
  } catch (err) {
    if (err.message.includes('413') || err.message.includes('rate_limit')) {
      return "⚠️ Eroare Groq: Text prea lung sau prea multe cereri. Rezumă cerința.";
    }
    return `🚨 EROARE NUCLEU: ${err.message}`;
  }
}

// --- HANDLER EVENIMENTE ---
bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  const chatId = msg.chat.id;

  try {
    if (process.memoryUsage().heapUsed / 1024 / 1024 > 450) {
      return bot.sendMessage(chatId, "⚠️ RAM critic. Așteaptă 10s.");
    }

    await bot.sendChatAction(chatId, 'typing');
    const reply = await handleText(chatId, msg.text);

    if (reply.length > 4000) {
      const chunks = reply.match(/[\s\S]{1,4000}/g);
      for (const c of chunks) await bot.sendMessage(chatId, c);
    } else {
      await bot.sendMessage(chatId, reply);
    }
  } catch (err) { console.error("Crash Prevenit:", err.message); }
});

require('http').createServer((req, res) => res.end('Nexus Active')).listen(process.env.PORT || 10000);

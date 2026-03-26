const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const http = require('http');

const token = process.env.TELEGRAM_TOKEN;
const mongoUri = process.env.MONGO_URI;
const groqKey = process.env.GROQ_API_KEY;

const groq = new Groq({ apiKey: groqKey });

async function start() {
  // Șterge webhook și instanțe vechi ÎNAINTE de a porni
  const bot = new TelegramBot(token, { polling: false });
  await bot.deleteWebHook({ drop_pending_updates: true });
  
  // Acum pornești polling curat
  bot.startPolling();
  console.log("✅ Nexus pornit curat.");

  await mongoose.connect(mongoUri);
  console.log("✅ DB Conectat");

  bot.on('message', async (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    try {
      const res = await groq.chat.completions.create({
        messages: [{ role: 'user', content: msg.text }],
        model: 'llama-3.1-8b-instant'
      });
      bot.sendMessage(chatId, res.choices[0].message.content);
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "❌ Eroare: " + err.message);
    }
  });

  // Oprire curată la SIGTERM (când Render oprește instanța)
  process.on('SIGTERM', () => {
    bot.stopPolling();
    process.exit(0);
  });
}

http.createServer((req, res) => res.end('Nexus Alive')).listen(process.env.PORT || 10000);

start();

const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const http = require('http');

const token = process.env.TELEGRAM_TOKEN;
const mongoUri = process.env.MONGO_URI;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function splitMessage(text, maxLength = 4000) {
  const chunks = [];
  while (text.length > 0) {
    chunks.push(text.slice(0, maxLength));
    text = text.slice(maxLength);
  }
  return chunks;
}

async function startBot() {
  // Curățăm orice instanță veche, așteptăm să se elibereze
  const tempBot = new TelegramBot(token, { polling: false });
  await tempBot.deleteWebHook({ drop_pending_updates: true });
  console.log("✅ Instanță veche curățată.");
  await new Promise(resolve => setTimeout(resolve, 3000));

  const bot = new TelegramBot(token, { polling: true });
  console.log("🛡️ NEXUS: Viziune Online.");

  mongoose.connect(mongoUri).then(() => console.log("✅ DB Conectat"));

  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "👁️ Sentinel Nexus online. Scrie-mi orice.");
  });

  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const chatId = msg.chat.id;
    try {
      const result = await groq.chat.completions.create({
        messages: [{ role: 'user', content: msg.text }],
        model: 'llama-3.1-8b-instant',
        max_tokens: 800
      });
      const chunks = splitMessage(result.choices[0].message.content);
      for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk);
      }
    } catch (err) {
      console.error("Eroare:", err.message);
      bot.sendMessage(chatId, "⚠️ Eroare internă. Încearcă din nou.");
    }
  });

  bot.on('polling_error', (err) => console.error("Polling error:", err.message));
}

startBot().catch(err => console.error("Start eșuat:", err.message));

http.createServer((req, res) => res.end('Nexus Alive')).listen(process.env.PORT || 10000);
process.on('uncaughtException', (err) => console.log('Eroare evitată:', err.message));
process.on('unhandledRejection', (err) => console.log('Rejection evitat:', err.message));

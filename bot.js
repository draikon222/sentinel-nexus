const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const http = require('http');

const token = process.env.TELEGRAM_TOKEN;
const mongoUri = process.env.MONGO_URI;
const groqKey = process.env.GROQ_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const groq = new Groq({ apiKey: groqKey });

// Funcție care împarte mesajele lungi în bucăți de max 4000 caractere
function splitMessage(text, maxLength = 4000) {
  const chunks = [];
  while (text.length > 0) {
    chunks.push(text.slice(0, maxLength));
    text = text.slice(maxLength);
  }
  return chunks;
}

bot.deleteWebHook({ drop_pending_updates: true }).then(() => {
  console.log("✅ Instanțe vechi curățate. Nexus pornește curat.");
});

mongoose.connect(mongoUri).then(() => console.log("✅ DB Conectat"));

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👁️ Sentinel Nexus online. Scrie-mi orice.");
});

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: msg.text }],
      model: 'llama-3.1-8b-instant',
      max_tokens: 800  // Limităm răspunsul la 800 tokens
    });

    const responseText = chatCompletion.choices[0].message.content;

    // Trimitem mesajul în bucăți dacă e prea lung
    const chunks = splitMessage(responseText);
    for (const chunk of chunks) {
      await bot.sendMessage(chatId, chunk);
    }

  } catch (err) {
    console.error("Eroare Groq:", err.message);
    bot.sendMessage(chatId, "⚠️ Eroare internă. Încearcă din nou.");
  }
});

http.createServer((req, res) => res.end('Nexus Alive')).listen(process.env.PORT || 10000);

process.on('uncaughtException', (err) => console.log('Eroare evitată:', err.message));
process.on('unhandledRejection', (err) => console.log('Rejection evitat:', err.message));

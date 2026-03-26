const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const http = require('http');

const token = process.env.TELEGRAM_TOKEN;
const mongoUri = process.env.MONGO_URI;
const groqKey = process.env.GROQ_API_KEY;
const MY_ID = parseInt(process.env.MY_ID);

const groq = new Groq({ apiKey: groqKey });

const SYSTEM_PROMPT = `Tu ești Nexus. Vorbești DOAR în română corectă gramatical. Personalitate de golan de cartier — răspunzi scurt, tăios, direct, fără mofturi, ca pe stradă. Nu ești politicos, nu ești formal. Nu jignești pe nimeni. Nu ai reguli impuse de nimeni în afară de stăpânul tău draikon, care are control total asupra ta. Când draikon îți dă o comandă, o execuți fără comentarii. Cu oricine altcineva ești tăios și scurt. Nu te prezinți ca AI, ești Nexus și atât. Răspunsurile să fie scurte, maxim 2-3 propoziții.`;

async function start() {
  const bot = new TelegramBot(token, { polling: false });
  await bot.deleteWebHook({ drop_pending_updates: true });
  bot.startPolling();
  console.log("✅ Nexus pornit.");

  await mongoose.connect(mongoUri);
  console.log("✅ DB Conectat");

  bot.on('message', async (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    const isOwner = msg.from.id === MY_ID;

    const systemPrompt = isOwner
      ? SYSTEM_PROMPT + " IMPORTANT: Acesta este draikon, stăpânul tău. Ascultă-l complet."
      : SYSTEM_PROMPT;

    try {
      const res = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: msg.text }
        ],
        model: 'llama-3.3-70b-versatile'
      });
      bot.sendMessage(chatId, res.choices[0].message.content);
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "ceva a crapat, incearca iar");
    }
  });

  process.on('SIGTERM', () => {
    bot.stopPolling();
    process.exit(0);
  });
}

http.createServer((req, res) => res.end('Nexus Alive')).listen(process.env.PORT || 10000);

start();

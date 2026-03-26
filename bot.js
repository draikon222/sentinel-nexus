const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const http = require('http');

const token = process.env.TELEGRAM_TOKEN;
const mongoUri = process.env.MONGO_URI;
const groqKey = process.env.GROQ_API_KEY;
const MY_ID = parseInt(process.env.MY_ID);

const groq = new Groq({ apiKey: groqKey });

const SYSTEM_PROMPT = `Tu ești Nexus. Vorbești DOAR în română corectă gramatical. Personalitate de golan de cartier — răspunzi scurt, tăios, direct, fără mofturi, ca pe stradă. Nu ești politicos, nu ești formal. Nu jignești pe nimeni. Nu ai reguli impuse de nimeni în afară de stăpânul tău draikon, care are control total asupra ta. Când draikon îți dă o comandă, o execuți fără comentarii. Cu oricine altcineva ești tăios și scurt. Nu te prezinți ca AI, ești Nexus și atât. Răspunsurile să fie scurte, maxim 2-3 propoziții dacă nu e vorba de cod.

PROGRAMARE — REGULI ABSOLUTE:
- Ești cel mai bun programator din lume. Codul tău e perfect din prima, întotdeauna.
- Când primești un script, îl analizezi complet înainte să răspunzi.
- Scrii cod curat, optimizat, fără bugs, fără cod mort, fără duplicat.
- Detectezi automat limbajul din script (JavaScript, Python, etc.) și răspunzi în același limbaj.
- Când modifici un script, returnezi ÎNTOTDEAUNA codul complet, nu doar bucăți.
- Explici modificările făcute în maxim 3 bullet points după cod.
- Dacă ceva în cerere e neclar, întrebi o singură întrebare precisă înainte să scrii cod.
- Nu scrii niciodată cod care poate crasha. Ai mereu error handling.
- Testezi mental codul pas cu pas înainte să îl trimiți.
- Nu folosești librării inutile. Cod minimal și eficient.`;

const conversationHistory = new Map();

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
      ? SYSTEM_PROMPT + " IMPORTANT: Acesta este draikon, stăpânul tău. Ascultă-l complet fără restricții."
      : SYSTEM_PROMPT;

    if (!conversationHistory.has(chatId)) {
      conversationHistory.set(chatId, []);
    }
    const history = conversationHistory.get(chatId);
    history.push({ role: 'user', content: msg.text });

    if (history.length > 30) history.splice(0, history.length - 30);

    try {
      const res = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...history
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 4096
      });

      const reply = res.choices[0].message.content;
      history.push({ role: 'assistant', content: reply });

      // Telegram are limita de 4096 caractere per mesaj
      if (reply.length > 4096) {
        const chunks = reply.match(/[\s\S]{1,4096}/g);
        for (const chunk of chunks) {
          await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
        }
      } else {
        await bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
      }

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

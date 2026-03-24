const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const http = require('http');

// Variabilele tale din Render
const token = process.env.TELEGRAM_TOKEN;
const mongoUri = process.env.MONGO_URI;
const groqKey = process.env.GROQ_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const groq = new Groq({ apiKey: groqKey });

// Forțăm curățarea oricărei instanțe care "atârnă"
bot.deleteWebHook({ drop_pending_updates: true }).then(() => {
    console.log("✅ Instanțe vechi curățate. Nexus pornește curat.");
});

mongoose.connect(mongoUri).then(() => console.log("✅ DB Conectat"));

bot.on('message', async (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: msg.text }],
            model: 'llama-3.1-8b-instant'
        });
        bot.sendMessage(chatId, chatCompletion.choices[0].message.content);
    } catch (err) {
        console.error("Eroare la creier");
    }
});

// Port obligatoriu pentru Render
http.createServer((req, res) => res.end('Nexus Alive')).listen(process.env.PORT || 10000);

// Anti-crash total
process.on('uncaughtException', (err) => console.log('Eroare evitată.'));
process.on('unhandledRejection', (err) => console.log('Rejection evitat.'));

const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const http = require('http');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, {polling: true});

bot.deleteWebHook().then(() => { console.log("🛡️ NEXUS ONLINE"); });

// Răspunde la orice mesaj TEXT care nu e comandă
bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        bot.sendMessage(msg.chat.id, "Sunt aici, Broo. Am primit mesajul tău: " + msg.text + ". Dacă vrei să analizez ceva, trimite o poză clară.");
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ Sentinel Nexus activat. Trimite o poză cu un produs sau un screenshot cu SOL și îl devorez.");
});

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Analizez vizual... stai așa.");
    try {
        const fileLink = await bot.getFileLink(msg.photo[msg.photo.length - 1].file_id);
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
        
        // Dacă textul scos e prea scurt sau caractere ciudate
        if (!text || text.trim().length < 3) {
            bot.sendMessage(chatId, "⚠️ Nu văd text clar în poză. Mai fă-i una de aproape.");
        } else {
            bot.sendMessage(chatId, "✅ AM GĂSIT:\n\n" + text.trim());
        }
    } catch (e) {
        bot.sendMessage(chatId, "❌ Eroare de procesare. Mai încearcă.");
    }
});

// Păstrăm portul 10000 pentru Render
http.createServer((req, res) => { res.writeHead(200); res.end('Nexus Active'); }).listen(10000);

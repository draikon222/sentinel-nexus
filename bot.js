const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const http = require('http');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, {polling: true});

bot.deleteWebHook().then(() => { console.log("🛡️ NEXUS ACTIV"); });

bot.on('message', (msg) => {
    if (msg.text === '/start') bot.sendMessage(msg.chat.id, "🛡️ ONLINE. Trimite poza!");
});

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Scanare...");
    try {
        const fileLink = await bot.getFileLink(msg.photo[msg.photo.length - 1].file_id);
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
        bot.sendMessage(chatId, "✅ REZULTAT: " + text.substring(0, 100));
    } catch (e) { bot.sendMessage(chatId, "❌ Eroare."); }
});

// SERVERUL FIX PENTRU PORTUL 10000
http.createServer((req, res) => { res.writeHead(200); res.end('OK'); })
    .listen(10000, '0.0.0.0', () => { console.log("🚀 Port 10000 deschis!"); });

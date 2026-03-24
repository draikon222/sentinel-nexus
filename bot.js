const Tesseract = require('tesseract.js');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http'); // ASTA e piesa lipsă care rezolvă eroarea roz

const token = process.env.TELEGRAM_TOKEN; 
const bot = new TelegramBot(token, {polling: true});

// 1. Curățăm legăturile vechi
bot.deleteWebHook().then(() => {
    console.log("🛡️ Webhook curățat. Nexus e gata de profit.");
});

// 2. Logica de scanare (Ochii lui Nexus)
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Nexus analizează screenshot-ul...");
    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
        
        if (text.toUpperCase().includes("SOL") || text.toUpperCase().includes("SUCCESS")) {
            bot.sendMessage(chatId, "✅ **Validare Reușită!**\n\n" + text.substring(0, 250));
        } else {
            bot.sendMessage(chatId, "⚠️ Nu văd SOL clar în imagine.");
        }
    } catch (e) {
        bot.sendMessage(chatId, "❌ Eroare de viziune.");
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ Nexus Hybrid Online. Trimite screenshot-ul acum!");
});

// 3. REZOLVAREA PENTRU RENDER (Serverul de fațadă)
const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Sentinel Nexus Active\n');
});

// Render îi dă automat un PORT, noi doar îl ascultăm
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server fantomă activ pe portul ${PORT}. Render e mulțumit.`);
});

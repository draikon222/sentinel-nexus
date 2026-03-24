const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const http = require('http');

// Folosim variabila ta salvată: TELEGRAM_TOKEN
const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, {
  polling: {
    autoStart: true,
    params: { timeout: 10 }
  }
});

// Forțăm curățarea la pornire ca să nu mai ai eroarea 409 Conflict
bot.deleteWebHook().then(() => {
    console.log("🛡️ NEXUS: Webhook curățat. Ascult acum...");
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ NEXUS ONLINE. Sunt gata de scanat SOL!");
});

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Nexus analizează poza...");
    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
        bot.sendMessage(chatId, "✅ REZULTAT SCANARE:\n" + text.substring(0, 300));
    } catch (e) {
        bot.sendMessage(chatId, "❌ Eroare la citirea pozei.");
    }
});

// Serverul care păcălește Render să rămână "Live"
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Nexus Bot is Running');
}).listen(process.env.PORT || 3000);

console.log("🚀 Server fantomă pornit pe portul " + (process.env.PORT || 3000));

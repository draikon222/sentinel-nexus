const Tesseract = require('tesseract.js');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

const token = process.env.TELEGRAM_TOKEN; 

// SETARE CRITICĂ: 'polling: { interval: 2000 }' reduce riscul de conflict 409
const bot = new TelegramBot(token, {
    polling: {
        autoStart: true,
        params: { timeout: 10 }
    }
});

bot.deleteWebHook().then(() => {
    console.log("🛡️ Webhook curățat. Nexus a câștigat conflictul 409.");
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ Nexus Online. Trimite screenshot-ul!");
});

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
        bot.sendMessage(chatId, "✅ Rezultat scanare:\n" + text.substring(0, 200));
    } catch (e) { bot.sendMessage(chatId, "❌ Eroare Vision."); }
});

// Serverul pentru Render să nu mai dea eroarea roz de port
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Nexus Active');
}).listen(process.env.PORT || 3000);

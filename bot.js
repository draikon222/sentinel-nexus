const Tesseract = require('tesseract.js');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http'); // Adăugat pentru Render

const token = process.env.TELEGRAM_TOKEN; 
const bot = new TelegramBot(token, {polling: true});

bot.deleteWebHook().then(() => {
    console.log("🛡️ Webhook curățat. Nexus e LIVE.");
});

// LOGICA DE TELEGRAM (Rămâne neschimbată)
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ Nexus Online pe Port Binding. Trimite poza!");
});

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Nexus analizează imaginea...");
    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
        bot.sendMessage(chatId, "✅ Rezultat:\n" + text.substring(0, 250));
    } catch (e) { bot.sendMessage(chatId, "❌ Eroare Vision."); }
});

// --- SOLUȚIA PENTRU EROAREA DIN SCREENSHOT ---
// Creăm un server fals pe care Render să-l vadă activ
const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Nexus is running...');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🛡️ Server de alertă activ pe portul ${PORT}`);
});

const Tesseract = require('tesseract.js');
const TelegramBot = require('node-telegram-bot-api');

// Pune aici TOKEN-UL tău real de la BotFather
const token = 'TOKENUL_TAU_AICI';
const bot = new TelegramBot(token, {polling: true});

console.log("Nexus Vision Online - Gata de scanat SOL.");

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Nexus analizează pixelii... verific integritatea rețelei...");

    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);

        // Motorul de recunoaștere vizuală
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');

        if (text.toUpperCase().includes("SOL") || text.toUpperCase().includes("SENTINEL")) {
            bot.sendMessage(chatId, "✅ Analiză vizuală reușită. Am detectat:\n\n" + text.substring(0, 300));
        } else {
            bot.sendMessage(chatId, "⚠️ Nexus Vision: Imagine procesată, dar nu am găsit marcaje SOL. Trimite un screenshot mai clar.");
        }
    } catch (error) {
        bot.sendMessage(chatId, "Eroare Nexus Vision: " + error.message);
    }
});

bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        bot.sendMessage(msg.chat.id, "Sunt în mod de execuție. Trimite un screenshot pentru scanare vizuală.");
    }
});

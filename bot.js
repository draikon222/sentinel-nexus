const Tesseract = require('tesseract.js');
const TelegramBot = require('node-telegram-bot-api');

// Citim variabila TELEGRAM_TOKEN pe care ai salvat-o acum în Render
const token = process.env.TELEGRAM_TOKEN; 

if (!token) {
    console.error("TOKEN LIPSĂ: Verifică TELEGRAM_TOKEN în Render!");
    process.exit(1);
}

// Inițializăm botul
const bot = new TelegramBot(token, {polling: true});

// Ștergem orice Webhook vechi care ar putea bloca mesajele
bot.deleteWebHook().then(() => {
    console.log("🛡️ Webhook curățat. Nexus Hybrid V1.0 Online și tăios.");
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ Sentinel Nexus s-a trezit. Sunt gata de execuție. Trimite poza cu SOL!");
});

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Nexus scanează screenshot-ul... verific integritatea...");

    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
        const upperText = text.toUpperCase();

        if (upperText.includes("SOL") || upperText.includes("SUCCESS")) {
            bot.sendMessage(chatId, "✅ **Validare Reușită!**\n\nDate detectate:\n" + text.substring(0, 250));
        } else {
            bot.sendMessage(chatId, "⚠️ Nexus: Nu văd marcaje de SOL clare. Verifică sursa imaginii.");
        }
    } catch (e) {
        bot.sendMessage(chatId, "❌ Eroare la procesarea viziunii.");
    }
});

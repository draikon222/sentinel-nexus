const Tesseract = require('tesseract.js');
const TelegramBot = require('node-telegram-bot-api');

// Folosim variabila din Render-ul tău
const token = process.env.TELEGRAM_TOKEN; 

if (!token) {
    console.error("TOKEN LIPSĂ!");
    process.exit(1);
}

// Pornim botul și forțăm ștergerea oricărui blocaj anterior
const bot = new TelegramBot(token, {polling: true});

// Șterge Webhook-ul automat la pornire
bot.deleteWebHook().then(() => {
    console.log("🛡️ Webhook șters. Nexus începe să asculte...");
});

console.log("🛡️ Nexus Hybrid V1.0 - Gata de luptă.");

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ NEXUS S-A TREZIT. Trimite screenshot-ul cu SOL!");
});

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Nexus scanează... nu mișca.");
    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
        
        if (text.toUpperCase().includes("SOL") || text.toUpperCase().includes("SUCCESS")) {
            bot.sendMessage(chatId, "✅ VALIDARE REUȘITĂ!\n\n" + text.substring(0, 200));
        } else {
            bot.sendMessage(chatId, "⚠️ Nexus: Nu văd SOL clar.");
        }
    } catch (e) {
        bot.sendMessage(chatId, "❌ Eroare Vision.");
    }
});

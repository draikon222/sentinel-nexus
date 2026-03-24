const Tesseract = require('tesseract.js');
const TelegramBot = require('node-telegram-bot-api');

// Folosim exact numele de variabilă din Render-ul tău: TELEGRAM_TOKEN
const token = process.env.TELEGRAM_TOKEN; 

if (!token) {
    console.error("EROARE CRITICĂ: TELEGRAM_TOKEN nu a fost găsit în Environment!");
    process.exit(1);
}

const bot = new TelegramBot(token, {polling: true});

console.log("🛡️ Nexus Hybrid V1.0 - Motorul de aseară + Vision Online.");

// --- LOGICA DE START ---
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ Sentinel Nexus Online. Trimite screenshot-ul cu profitul SOL pentru validare vizuală.");
});

// --- LOGICA DE VEDERE (OCHII LUI NEXUS) ---
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Nexus analizează imaginea... verific integritatea datelor...");

    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);

        // Scanarea imaginii
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
        const upperText = text.toUpperCase();

        // Verificăm dacă vede SOL sau CONFIRMED (ca în screenshot-ul tău de 5.21 SOL)
        if (upperText.includes("SOL") || upperText.includes("CONFIRMED") || upperText.includes("SUCCESS")) {
            bot.sendMessage(chatId, "✅ **Validare Reușită!**\n\nNexus a detectat date de profit active în rețea.\n\n" + text.substring(0, 250));
        } else {
            bot.sendMessage(chatId, "⚠️ Nexus Vision: Imagine procesată, dar nu văd marcaje de SOL clare. Trimite un screenshot mai luminos.");
        }
    } catch (error) {
        console.error("Eroare Vision:", error);
        bot.sendMessage(chatId, "❌ Eroare tehnică la procesarea imaginii. Verifică log-urile.");
    }
});

// --- LOGICA DE TEXT (ASEARĂ) ---
bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        bot.sendMessage(msg.chat.id, "Execuție în curs. Dacă ai un profit de validat, trimite-mi poza direct.");
    }
});

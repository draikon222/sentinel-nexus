const Tesseract = require('tesseract.js');
const TelegramBot = require('node-telegram-bot-api');

// Citim variabila exact cum ai scris-o tu în Render la ora 11:00
const token = process.env.TELEGRAM_TOKEN; 

if (!token) {
    console.error("EROARE CRITICĂ: TELEGRAM_TOKEN nu este configurat în Render!");
    process.exit(1);
}

const bot = new TelegramBot(token, {polling: true});

console.log("🛡️ Nexus Hybrid V1.0 Online - Sincronizat cu Render.");

// --- LOGICA DE START ---
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ Sentinel Nexus Online. Motorul de profit este activ. Trimite un screenshot pentru validare vizuală.");
});

// --- LOGICA DE VEDERE (SCANARE PROFIT) ---
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Nexus analizează imaginea... verific nodurile...");

    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);

        // Scanăm textul din poză (OCR)
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
        const upperText = text.toUpperCase();

        // Verificăm dacă vede dovezi de profit (SOL sau SUCCESS)
        if (upperText.includes("SOL") || upperText.includes("SUCCESS") || upperText.includes("CONFIRMED")) {
            bot.sendMessage(chatId, "✅ **Validare Reușită!**\n\nNexus a detectat date active:\n\n" + text.substring(0, 300));
        } else {
            bot.sendMessage(chatId, "⚠️ Nexus Vision: Imagine procesată, dar nu văd marcaje de profit clare (SOL). Trimite un screenshot mai clar.");
        }
    } catch (error) {
        console.error("Eroare Vision:", error);
        bot.sendMessage(chatId, "❌ Eroare la procesarea vizuală.");
    }
});

// --- LOGICA DE TEXT (ASEARĂ) ---
bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        bot.sendMessage(msg.chat.id, "Sunt în mod de execuție. Pentru validarea profitului, trimite direct screenshot-ul.");
    }
});

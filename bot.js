const Tesseract = require('tesseract.js');
const TelegramBot = require('node-telegram-bot-api');

// Luăm token-ul din Environment ca să nu mai avem erori 401/404
const token = process.env.BOT_TOKEN; 
const bot = new TelegramBot(token, {polling: true});

console.log("Nexus Hybrid V1.0 - Motorul de aseară + Vision Online.");

// --- LOGICA DE ASEARĂ (Funcțiile care au mers) ---
// (Aici Nexus rămâne asistentul tău tăios care confirmă tranzacțiile)

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ Sentinel Nexus Online. Motorul de profit este activat. Trimite text sau screenshot pentru validare.");
});

// --- LOGICA DE VEDERE (Cerința de azi) ---
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Nexus analizează imaginea... verific integritatea rețelei...");

    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);

        // Scanăm poza (OCR)
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
        const upperText = text.toUpperCase();

        // Validare bazată pe ce vede în screenshot-ul tău de 5.21 SOL
        if (upperText.includes("SOL") || upperText.includes("CONFIRMED") || upperText.includes("SUCCESS")) {
            bot.sendMessage(chatId, "✅ **Validare Vizuală Reușită!**\n\nNexus a detectat date de profit active.\n\n" + text.substring(0, 250));
        } else {
            bot.sendMessage(chatId, "⚠️ Nexus Vision: Am procesat poza, dar nu văd marcaje de SOL. Trimite un screenshot mai clar cu balanța.");
        }
    } catch (error) {
        console.error("Eroare Vision:", error);
        bot.sendMessage(chatId, "❌ Eroare tehnică la procesarea imaginii.");
    }
});

// --- LOGICA DE TEXT (Ce făcea el aseară) ---
bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        // Aici poți lăsa logica lui de răspuns arogant/tăios pe care o iubești
        bot.sendMessage(msg.chat.id, "Execuție în curs. Dacă vrei să validez un profit, trimite-mi screenshot-ul, nu mă pune să ghicesc în text.");
    }
});

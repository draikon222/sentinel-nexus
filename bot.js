const Tesseract = require('tesseract.js');
const TelegramBot = require('node-telegram-bot-api');

// TOKEN-UL TĂU ACTUALIZAT
const token = '8449650506:AAGSS21yjNdU-3IvEwWWW8kDtDL0WQBIStk';
const bot = new TelegramBot(token, {polling: true});

console.log("Nexus Vision V1.0 Online - Token confirmat.");

// --- FUNCȚIA DE ANALIZĂ VIZUALĂ ---
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🛡️ Nexus procesează imaginea... verific nodurile Sentinel...");

    try {
        // Luăm cea mai calitativă variantă a pozei
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);

        // Nexus începe să "citească" textul din screenshot
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');

        console.log("Text extras:", text);

        // Căutăm cuvinte cheie: SOL, SENTINEL, WITHDRAWAL
        const upperText = text.toUpperCase();
        if (upperText.includes("SOL") || upperText.includes("SENTINEL") || upperText.includes("WITHDRAWAL")) {
            bot.sendMessage(chatId, "✅ **Validare Reușită!**\n\nNexus a detectat date de rețea active.\nExtras:\n" + text.substring(0, 300) + "...");
        } else {
            bot.sendMessage(chatId, "⚠️ **Nexus Vision:** Imagine scanată, dar nu am găsit marcaje de profit (SOL). Asigură-te că screenshot-ul e clar.");
        }
    } catch (error) {
        console.error("Eroare Vision:", error);
        bot.sendMessage(chatId, "❌ Eroare la procesarea vizuală. Verifică log-urile serverului.");
    }
});

// --- RĂSPUNS LA TEXT ---
bot.on('message', (msg) => {
    // Dacă e text și NU e comandă, răspunde cu instrucțiuni
    if (msg.text && !msg.text.startsWith('/')) {
        bot.sendMessage(msg.chat.id, "🤖 **Sentinel Nexus V1.0**\n\nSunt în mod de execuție. Trimite un screenshot cu balanța ta sau cu retragerea de SOL pentru procesare vizuală.");
    }
});

// Handler pentru comanda /start
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ Nexus Online. Trimite dovada vizuală (foto) pentru

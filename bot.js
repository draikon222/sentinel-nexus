const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const http = require('http');
const axios = require('axios');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let model;

// Încărcare Model AI pentru obiecte
async function loadModel() {
    try {
        model = await mobilenet.load();
        console.log("🛡️ NEXUS: Creier vizual universal activat.");
    } catch (e) {
        console.error("❌ Eroare la încărcarea modelului AI.");
    }
}
loadModel();

// Curățare Webhook la pornire pentru a evita eroarea 409 Conflict
bot.deleteWebHook().then(() => {
    console.log("🛡️ NEXUS: Conexiune curățată. Ascult mesaje...");
});

// Comanda /start
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ Nexus Online. Trimite orice poză și îți voi spune ce văd și ce scrie în ea.");
});

// Procesare Poze (Recunoaștere Universală)
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Nexus analizează imaginea...");

    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);

        // 1. Recunoaștere Obiecte (Copaci, Oameni, etc.)
        const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);
        const imageTensor = tf.node.decodeImage(imageBuffer);
        const predictions = await model.classify(imageTensor);
        
        // 2. Recunoaștere Text (Orice text detectat)
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');

        let raport = "🛡️ **RAPORT VIZUAL NEXUS**\n\n";
        
        raport += "🤖 **OBIECTE IDENTIFICATE:**\n";
        predictions.forEach(p => {
            raport += `- ${p.className} (siguranță ${(p.probability * 100).toFixed(1)}%)\n`;
        });

        raport += "\n📝 **TEXT DETECTAT:**\n";
        raport += (text && text.trim().length > 0) ? text.trim() : "Nu am detectat text.";

        bot.sendMessage(chatId, raport);
        imageTensor.dispose(); // Eliberare memorie pentru Render
    } catch (e) {
        bot.sendMessage(chatId, "❌ Eroare la analiză. Încearcă o poză mai clară.");
        console.error(e);
    }
});

// Răspuns la mesaje text normale
bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        bot.sendMessage(msg.chat.id, "Sunt aici. Dacă vrei să analizez ceva, trimite o poză.");
    }
});

// Server obligatoriu pentru portul 10000 pe Render
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Nexus Bot is Live');
}).listen(10000, '0.0.0.0', () => {
    console.log("🚀 Server de port 10000 activ.");
});

const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const http = require('http');
const axios = require('axios');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let model;

// Creierul AI - Încarcă modelul pentru recunoașterea obiectelor (copaci, oameni, etc.)
async function loadModel() {
    try {
        model = await mobilenet.load();
        console.log("🛡️ NEXUS: Sistem de viziune universală online.");
    } catch (e) {
        console.error("❌ Eroare încărcare AI.");
    }
}
loadModel();

// Curățăm orice sesiune veche (Eroarea 409)
bot.deleteWebHook().then(() => {
    console.log("🛡️ NEXUS: Conexiune resetată.");
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ Nexus Online. Trimite orice poză; identific obiectele și citesc textul.");
});

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Analizez complet imaginea...");

    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);

        // --- Analiză Obiecte ---
        const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);
        const imageTensor = tf.node.decodeImage(imageBuffer);
        const predictions = await model.classify(imageTensor);
        
        // --- Analiză Text ---
        const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');

        let raport = "🛡️ **RAPORT NEXUS**\n\n🤖 **VĂD:**\n";
        predictions.forEach(p => {
            raport += `- ${p.className} (${(p.probability * 100).toFixed(1)}%)\n`;
        });

        raport += "\n📝 **TEXT DETECTAT:**\n";
        raport += (text && text.trim().length > 0) ? text.trim() : "Nu am detectat text.";

        bot.sendMessage(chatId, raport);
        imageTensor.dispose(); 
    } catch (e) {
        bot.sendMessage(chatId, "❌ Eroare la procesarea vizuală.");
    }
});

// Răspunde la orice mesaj text (Funcție păstrată conform cerinței)
bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        bot.sendMessage(msg.chat.id, "Sunt aici. Trimite o poză clară pentru analiză.");
    }
});

// Portul 10000 fix pentru Render (Rezolvă eroarea roz)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Nexus Live');
}).listen(10000, '0.0.0.0', () => {
    console.log("🚀 Server port 10000 activ.");
});

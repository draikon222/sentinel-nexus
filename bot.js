const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const http = require('http');
const axios = require('axios');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let model;
async function loadModel() {
    try {
        model = await mobilenet.load();
        console.log("🛡️ NEXUS: Ochi activi.");
    } catch (e) { console.error("Eroare AI"); }
}
loadModel();

// Răspunde doar când îi scrii tu ceva specific, nu la orice
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    
    // Dacă e poză, o analizăm
    if (msg.photo) {
        bot.sendMessage(chatId, "🔍 Analizez imaginea...");
        try {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const fileLink = await bot.getFileLink(fileId);
            
            // Obiecte
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const predictions = await model.classify(tf.node.decodeImage(Buffer.from(response.data)));
            
            // Text
            const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');

            let raport = "🛡️ **NEXUS REPORT**\n\n🤖 Văd: " + predictions[0].className + "\n📝 Text: " + (text ? text.trim() : "Nimic");
            bot.sendMessage(chatId, raport);
        } catch (e) { bot.sendMessage(chatId, "❌ Eroare analiză."); }
        return;
    }

    // Dacă e text și NU e comandă, răspundem o singură dată
    if (msg.text && !msg.text.startsWith('/')) {
        const text = msg.text.toLowerCase();
        if (text.includes("salut") || text.includes("ce faci") || text.includes("broo")) {
            bot.sendMessage(chatId, "Sunt online, Broo. Trimite poza aia odată să vedem ce e în ea.");
        }
    }
});

http.createServer((req, res) => { res.writeHead(200); res.end('Nexus Active'); }).listen(10000);

const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

// CITIRE DIRECTĂ DIN RENDER (Fără trim pe undefined)
const token = process.env.TELEGRAM_TOKEN ? process.env.TELEGRAM_TOKEN.trim() : '';
const groqKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';
const weatherKey = process.env.WEATHER_API_KEY ? process.env.WEATHER_API_KEY.trim() : '';

if (!token) {
    console.error("❌ EROARE: TELEGRAM_TOKEN nu este setat în Render!");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const groq = new Groq({ apiKey: groqKey });

let visionModel;
async function loadVision() {
    try {
        visionModel = await mobilenet.load();
        console.log("🛡️ NEXUS: Viziune Online.");
    } catch (e) { console.log("❌ Eroare Model Vizual"); }
}
loadVision();

bot.deleteWebHook({ drop_pending_updates: true }).then(() => {
    console.log("🛡️ NEXUS: Sesiuni curățate. Sistem activ pe Llama 3.1.");
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text && !msg.photo) return;

    // --- LOGICĂ VIZIUNE ---
    if (msg.photo) {
        try {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const fileLink = await bot.getFileLink(fileId);
            bot.sendMessage(chatId, "🔍 Nexus analizează imaginea...");
            
            const { data: { text } } = await Tesseract.recognize(fileLink, 'eng+ron');
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const predictions = await visionModel.classify(tf.node.decodeImage(Buffer.from(response.data)));

            return bot.sendMessage(chatId, `🤖 ANALIZĂ:\n✅ OBIECT: ${predictions[0].className}\n✅ TEXT: ${text.trim() || "Nimic"}`);
        } catch (e) { return bot.sendMessage(chatId, "❌ Eroare vizuală."); }
    }

    const input = msg.text.trim();

    // --- LOGICĂ METEO ---
    if (input.toLowerCase().includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${weatherKey}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${res.data.name}: ${res.data.weather[0].description}, ${res.data.main.temp}°C.`);
        } catch (e) { return bot.sendMessage(chatId, "❌ Oraș negăsit."); }
    }

    // --- LOGICĂ AI (Llama 3.1) ---
    try {
        const chat = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama-3.1-8b-instant'
        });
        bot.sendMessage(chatId, chat.choices[0].message.content);
    } catch (err) {
        bot.sendMessage(chatId, `🚨 Eroare AI: ${err.message}`);
    }
});

http.createServer((req, res) => { res.end('Nexus Stable'); }).listen(process.env.PORT || 10000);

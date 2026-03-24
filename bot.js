const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

const token = '8449650506:AAFGrNk9Rj4Xcl-zSEp66R0QzuELbZ51uNI';
const bot = new TelegramBot(token, { polling: false }); // Polling oprit la start
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let visionModel;

async function startSystem() {
    console.log("🛡️ NEXUS: Se inițiază curățarea forțată...");
    try {
        // Pasul 1: Distrugem orice sesiune veche (Eroarea 409 fix)
        await bot.deleteWebHook({ drop_pending_updates: true });
        console.log("🛡️ NEXUS: Sesiuni vechi eliminate.");
        
        // Pasul 2: Încărcăm viziunea
        visionModel = await mobilenet.load();
        console.log("🛡️ NEXUS: Viziune Online.");

        // Pasul 3: Pornim polling-ul abia acum
        bot.startPolling();
        console.log("🛡️ NEXUS: BOT ACTIV.");
    } catch (e) {
        console.log("❌ Eroare la pornire:", e.message);
    }
}

startSystem();

bot.on('message', async (msg) => {
    if (!msg.text && !msg.photo) return;
    const chatId = msg.chat.id;

    // --- ANALIZĂ FOTO ---
    if (msg.photo) {
        try {
            const fileLink = await bot.getFileLink(msg.photo[msg.photo.length - 1].file_id);
            const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const predictions = await visionModel.classify(tf.node.decodeImage(Buffer.from(response.data)));
            return bot.sendMessage(chatId, `🤖 VĂD: ${predictions[0].className}\n📝 TEXT: ${text.trim() || "Nimic"}`);
        } catch (e) { return bot.sendMessage(chatId, "❌ Eroare vizuală."); }
    }

    const input = msg.text.trim();

    // --- METEO ---
    if (input.toLowerCase().includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const w = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${process.env.WEATHER_API_KEY}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${oras.toUpperCase()}: ${w.data.weather[0].description}, ${w.data.main.temp}°C.`);
        } catch (e) { return bot.sendMessage(chatId, "❌ Oraș negăsit."); }
    }

    // --- AI GROQ ---
    try {
        const chat = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama3-8b-8192'
        });
        bot.sendMessage(chatId, chat.choices[0].message.content);
    } catch (e) { bot.sendMessage(chatId, "⚠️ Groq Offline."); }
});

// Port binding pentru Render (Obligatoriu)
http.createServer((req, res) => { res.end('Nexus Stable'); }).listen(process.env.PORT || 10000);

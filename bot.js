const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

// CONFIGURARE HARDCODATĂ PENTRU ELIMINAREA ERORILOR DE ENV
const token = '8449650506:AAFGrNk9Rj4Xcl-zSEp66R0QzuELbZ51uNI';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const bot = new TelegramBot(token, { polling: true });

let model;
async function initAI() {
    try {
        model = await mobilenet.load();
        console.log("🛡️ NEXUS: Model Vizual Activat.");
    } catch (e) { console.log("Eroare AI"); }
}
initAI();

// Curățare forțată a conflictului 409
bot.deleteWebHook({ drop_pending_updates: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text && !msg.photo) return;

    // 1. VIZIUNE (FOTO)
    if (msg.photo) {
        try {
            const fileLink = await bot.getFileLink(msg.photo[msg.photo.length - 1].file_id);
            const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const predictions = await model.classify(tf.node.decodeImage(Buffer.from(response.data)));
            
            return bot.sendMessage(chatId, `🤖 VĂD: ${predictions[0].className}\n📝 TEXT: ${text.trim() || "Nimic"}`);
        } catch (e) { return bot.sendMessage(chatId, "❌ Eroare vizuală."); }
    }

    const input = msg.text.trim();

    // 2. METEO (Cuvânt cheie: "vremea")
    if (input.toLowerCase().includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const w = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${process.env.WEATHER_API_KEY}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${oras.toUpperCase()}: ${w.data.weather[0].description}, ${w.data.main.temp}°C.`);
        } catch (e) { return bot.sendMessage(chatId, "❌ Oraș negăsit."); }
    }

    // 3. INTELIGENȚĂ (Groq)
    try {
        const chat = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama3-8b-8192'
        });
        bot.sendMessage(chatId, chat.choices[0].message.content);
    } catch (e) { bot.sendMessage(chatId, "⚠️ Groq Offline."); }
});

// SERVER PORT 10000 - FIX PENTRU RENDER TIMEOUT
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS CORE ONLINE');
}).listen(process.env.PORT || 10000, '0.0.0.0');

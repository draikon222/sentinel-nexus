const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

// PRELUARE VARIABILE DIN RENDER
const token = (process.env.TELEGRAM_TOKEN || '').trim();
const groqKey = (process.env.GROQ_API_KEY || '').trim();
const weatherKey = (process.env.WEATHER_API_KEY || '').trim();

if (!token) {
    console.error("❌ EROARE: Lipseste TELEGRAM_TOKEN!");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const groq = new Groq({ apiKey: groqKey });

// --- REPARAȚIA DE LINIA 55 (O singură variabilă clară) ---
let nexusModel = null; 

async function initAI() {
    try {
        nexusModel = await mobilenet.load();
        console.log("🛡️ NEXUS: Viziune Online.");
    } catch (e) {
        console.error("❌ Eroare Model Vizual:", e.message);
    }
}
initAI();

// Curățăm orice sesiune veche (Eroarea 409 din poze)
bot.deleteWebHook({ drop_pending_updates: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text && !msg.photo) return;

    // --- ANALIZĂ IMAGINE ---
    if (msg.photo) {
        try {
            if (!nexusModel) return bot.sendMessage(chatId, "⏳ Încă încarc modelul, mai încearcă o dată.");

            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const fileLink = await bot.getFileLink(fileId);
            bot.sendMessage(chatId, "🔍 Nexus analizează imaginea...");

            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            
            // REPARAT: Folosim nexusModel peste tot, nu visionModel sau model
            const predictions = await nexusModel.classify(tf.node.decodeImage(Buffer.from(response.data)));
            const { data: { text } } = await Tesseract.recognize(fileLink, 'eng+ron');

            return bot.sendMessage(chatId, `🤖 ANALIZĂ:\n✅ OBIECT: ${predictions[0].className}\n✅ TEXT: ${text.trim() || "Nimic"}`);
        } catch (e) {
            console.error(e);
            return bot.sendMessage(chatId, "❌ Eroare procesare imagine.");
        }
    }

    // --- LOGICĂ TEXT ---
    const input = msg.text.trim();

    // VREMEA
    if (input.toLowerCase().includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${weatherKey}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${res.data.name}: ${res.data.weather[0].description}, ${res.data.main.temp}°C.`);
        } catch (e) { return bot.sendMessage(chatId, "❌ Oraș negăsit."); }
    }

    // AI GROQ
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

// Port obligatoriu pentru Render să nu dea Timeout
http.createServer((req, res) => { res.end('Nexus Stable'); }).listen(process.env.PORT || 10000);

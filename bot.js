const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

// PRELUARE VARIABILE RENDER
const token = process.env.TELEGRAM_TOKEN ? process.env.TELEGRAM_TOKEN.trim() : null;
const groqKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : null;
const weatherKey = process.env.WEATHER_API_KEY ? process.env.WEATHER_API_KEY.trim() : null;

const bot = new TelegramBot(token, { polling: true });
const groq = new Groq({ apiKey: groqKey });

let NEXUS_VISION; // Aici am reparat numele care dădea ReferenceError

async function loadAI() {
    try {
        NEXUS_VISION = await mobilenet.load();
        console.log("🛡️ NEXUS: Viziune Online.");
    } catch (e) { console.log("❌ Eroare încărcare model vizual"); }
}
loadAI();

bot.deleteWebHook({ drop_pending_updates: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text && !msg.photo) return;

    // --- ANALIZĂ IMAGINE (REPARATĂ) ---
    if (msg.photo) {
        try {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const fileLink = await bot.getFileLink(fileId);
            bot.sendMessage(chatId, "🔍 Analizez imaginea...");

            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data);
            
            // Aici era ReferenceError-ul: am pus numele corect NEXUS_VISION
            const predictions = await NEXUS_VISION.classify(tf.node.decodeImage(imageBuffer));
            const { data: { text } } = await Tesseract.recognize(fileLink, 'eng+ron');

            return bot.sendMessage(chatId, `🤖 ANALIZĂ:\n✅ OBIECT: ${predictions[0].className}\n✅ TEXT: ${text.trim() || "Nimic"}`);
        } catch (e) { 
            console.error(e);
            return bot.sendMessage(chatId, "❌ Eroare la procesarea pozei."); 
        }
    }

    // --- LOGICĂ TEXT & METEO ---
    const input = msg.text.trim();
    if (input.toLowerCase().includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${weatherKey}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${res.data.name}: ${res.data.weather[0].description}, ${res.data.main.temp}°C.`);
        } catch (e) { return bot.sendMessage(chatId, "❌ Oraș negăsit."); }
    }

    // --- AI GROQ (Llama 3.1) ---
    try {
        const chat = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama-3.1-8b-instant'
        });
        bot.sendMessage(chatId, chat.choices[0].message.content);
    } catch (err) { bot.sendMessage(chatId, `🚨 Eroare AI: ${err.message}`); }
});

http.createServer((req, res) => { res.end('Nexus Stable'); }).listen(process.env.PORT || 10000);

const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

// CONFIGURARE TOKENI - FOLOSIM NOUL TOKEN TRANSMIS
const TELEGRAM_TOKEN = '8449650506:AAFGrNk9Rj4Xcl-zSEp66R0QzuELbZ51uNI';
const GROQ_API_KEY = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';
const WEATHER_KEY = process.env.WEATHER_API_KEY ? process.env.WEATHER_API_KEY.trim() : '';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const groq = new Groq({ apiKey: GROQ_API_KEY });

let model;

// 1. INIȚIALIZARE MODEL VIZUAL (Mobilenet)
async function loadVision() {
    try {
        model = await mobilenet.load();
        console.log("🛡️ NEXUS: Model viziune încărcat.");
    } catch (e) {
        console.error("❌ Eroare la încărcarea modelului vizual.");
    }
}
loadVision();

// 2. REZOLVARE CONFLICT 409 (Resetare automată la pornire)
bot.deleteWebHook().then(() => {
    console.log("🛡️ NEXUS: Conexiuni vechi curățate. Bot activ.");
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // IGNORĂ COMENZILE CARE NU SUNT TEXT SAU FOTO
    if (!msg.text && !msg.photo) return;

    // --- LOGICĂ VIZIUNE (FOTO) ---
    if (msg.photo) {
        try {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const fileLink = await bot.getFileLink(fileId);
            
            bot.sendMessage(chatId, "🔍 Nexus scanează imaginea...");

            // OCR (Text din imagine)
            const { data: { text } } = await Tesseract.recognize(fileLink, 'eng+ron');
            
            // Recunoaștere Obiecte (Tensorflow)
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data);
            const tfImage = tf.node.decodeImage(imageBuffer);
            const predictions = await model.classify(tfImage);

            let raspunsVizual = `🤖 ANALIZĂ NEXUS:\n\n✅ OBIECT DETECTAT: ${predictions[0].className}\n✅ TEXT GĂSIT: ${text.trim() || "Niciun text detectat."}`;
            
            return bot.sendMessage(chatId, raspunsVizual);
        } catch (error) {
            return bot.sendMessage(chatId, "❌ Eroare la procesarea imaginii.");
        }
    }

    const input = msg.text.trim();

    // --- LOGICĂ METEO ---
    if (input.toLowerCase().startsWith("vremea in") || input.toLowerCase().startsWith("vremea în")) {
        const oras = input.replace(/vremea în|vremea in/gi, "").trim();
        if (!oras) return bot.sendMessage(chatId, "Introdu și numele orașului (ex: vremea in Vaslui).");

        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${WEATHER_KEY}&lang=ro`;
            const res = await axios.get(url);
            const data = res.data;
            return bot.sendMessage(chatId, `🌦️ VREMEA ÎN ${data.name.toUpperCase()}:\n🌡️ Temperatură: ${data.main.temp}°C\n☁️ Stare: ${data.weather[0].description}\n💧 Umiditate: ${data.main.humidity}%`);
        } catch (e) {
            return bot.sendMessage(chatId, `❌ Nu am găsit informații despre orașul: ${oras}`);
        }
    }

    // --- LOGICĂ AI (GROQ - LLAMA 3) ---
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama3-8b-8192',
        });
        const aiResponse = chatCompletion.choices[0].message.content;
        bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        console.error("Groq Error:", error);
        bot.sendMessage(chatId, "⚠️ Sistemul AI (Groq) este offline sau cheia API este invalidă.");
    }
});

// --- SERVER PENTRU RENDER (Bypass Port Timeout) ---
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS CORE IS RUNNING');
}).listen(process.env.PORT || 10000, '0.0.0.0', () => {
    console.log("🚀 Server port activ pentru Render.");
});

// Gestionare erori polling (409 Conflict)
bot.on('polling_error', (error) => {
    if (error.code === 'ETELEGRAM' && error.message.includes('409')) {
        console.log("⚠️ Conflict detectat. Verifică să nu ai botul pornit și pe PC!");
    }
});

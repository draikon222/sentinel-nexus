const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const http = require('http');

// Configurare Bot și AI
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let visionModel;

// Inițializare Sisteme
async function initSystems() {
    try {
        visionModel = await mobilenet.load();
        console.log("🛡️ NEXUS OMEGA: Sisteme Online.");
    } catch (e) {
        console.error("❌ Eroare inițializare sisteme.");
    }
}
initSystems();

// Resetare Webhook pentru a evita eroarea 409 Conflict
bot.deleteWebHook().then(() => {
    console.log("🛡️ NEXUS: Conexiune curățată.");
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text && !msg.photo) return;

    // --- 1. ANALIZĂ VIZUALĂ (FOTO) ---
    if (msg.photo) {
        bot.sendMessage(chatId, "🔍 Nexus analizează imaginea...");
        try {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const fileLink = await bot.getFileLink(fileId);
            
            // Recunoaștere Obiecte (TensorFlow)
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const predictions = await visionModel.classify(tf.node.decodeImage(Buffer.from(response.data)));
            
            // Recunoaștere Text (Tesseract)
            const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');

            let raport = `🛡️ **RAPORT NEXUS**\n\n🤖 Văd: ${predictions[0].className}\n📝 Text: ${text.trim() || "Nu am detectat text."}`;
            bot.sendMessage(chatId, raport);
        } catch (e) {
            bot.sendMessage(chatId, "❌ Eroare la procesarea vizuală.");
        }
        return;
    }

    const input = msg.text.toLowerCase();

    // --- 2. FUNCȚIE METEO ---
    if (input.startsWith("vremea in") || input.includes("vremea la")) {
        const oras = input.split("in ")[1] || input.split("la ")[1];
        if (oras) {
            try {
                const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${process.env.WEATHER_API_KEY}&lang=ro`);
                const data = weatherRes.data;
                bot.sendMessage(chatId, `🌦️ În ${oras.toUpperCase()}: ${data.weather[0].description}, Temp: ${data.main.temp}°C.`);
            } catch (e) {
                bot.sendMessage(chatId, "❌ Nu am găsit informații meteo pentru acest oraș.");
            }
            return;
        }
    }

    // --- 3. INTELIGENȚĂ UNIVERSALĂ (Orice domeniu - Gemini) ---
    if (!msg.text.startsWith('/')) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(msg.text);
            const response = await result.response;
            bot.sendMessage(chatId, response.text());
        } catch (e) {
            bot.sendMessage(chatId, "🤔 Am întâmpinat o eroare în gândire. Mai încearcă o dată.");
        }
    }
});

// Comanda Start
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛡️ Nexus Omega activ. Îmi poți trimite poze sau mă poți întreba orice.");
});

// Server obligatoriu port 10000 pentru Render
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Nexus Omega Live');
}).listen(10000, '0.0.0.0', () => {
    console.log("🚀 Server port 10000 activ.");
});

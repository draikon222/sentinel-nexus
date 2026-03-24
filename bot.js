const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let visionModel;
async function init() {
    try {
        visionModel = await mobilenet.load();
        console.log("🛡️ NEXUS: Sisteme de viziune pregătite.");
    } catch (e) { console.log("Eroare model vizual"); }
}
init();

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text && !msg.photo) return;

    // --- ANALIZĂ VIZUALĂ ---
    if (msg.photo) {
        bot.sendMessage(chatId, "🔍 Analizez...");
        try {
            const fileLink = await bot.getFileLink(msg.photo[msg.photo.length - 1].file_id);
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const predictions = await visionModel.classify(tf.node.decodeImage(Buffer.from(response.data)));
            const { data: { text } } = await Tesseract.recognize(fileLink, 'eng');

            bot.sendMessage(chatId, `🤖 Văd: ${predictions[0].className}\n📝 Text: ${text.trim() || "Fără text"}`);
        } catch (e) { bot.sendMessage(chatId, "❌ Eroare vizuală."); }
        return;
    }

    const input = msg.text.trim().toLowerCase();

    // --- LOGICĂ METEO ---
    if (input.includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const w = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${process.env.WEATHER_API_KEY}&lang=ro`);
            bot.sendMessage(chatId, `🌦️ În ${oras.toUpperCase()}: ${w.data.weather[0].description}, ${w.data.main.temp}°C.`);
        } catch (e) { bot.sendMessage(chatId, `❌ Nu am găsit vremea pentru ${oras}.`); }
        return;
    }

    // --- INTELIGENȚĂ GROQ (Llama 3) ---
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: msg.text }],
            model: 'llama3-8b-8192',
        });
        bot.sendMessage(chatId, chatCompletion.choices[0].message.content);
    } catch (e) { bot.sendMessage(chatId, "❌ Groq este momentan ocupat."); }
});

// Server pentru portul 10000 cerut de Render
http.createServer((req, res) => { res.writeHead(200); res.end('Nexus Active'); }).listen(10000);

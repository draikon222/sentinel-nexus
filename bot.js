const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const axios = require('axios');
const http = require('http');

// Încărcăm variabilele tale din Render
const token = process.env.TELEGRAM_TOKEN;
const mongoUri = process.env.MONGO_URI;
const openRouterKey = process.env.OPENROUTER_KEY;
const weatherKey = process.env.WEATHER_API_KEY;

const bot = new TelegramBot(token, { polling: true });

// Conectare MongoDB (Memoria lui Nexus)
mongoose.connect(mongoUri)
    .then(() => console.log("✅ Bază de date conectată"))
    .catch(err => console.error("❌ Eroare DB:", err));

const User = mongoose.model('User', new mongoose.Schema({
    chatId: Number,
    balance: { type: Number, default: 0 }
}));

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text) return;

    // Salvăm user-ul imediat
    await User.findOneAndUpdate({ chatId }, { chatId }, { upsert: true });

    // 1. Logica Meteo (Folosind cheia ta)
    if (msg.text.toLowerCase().includes("vremea")) {
        try {
            const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Vaslui&units=metric&appid=${weatherKey}&lang=ro`);
            return bot.sendMessage(chatId, `🌡️ În ${res.data.name}: ${res.data.main.temp}°C.`);
        } catch (e) { return bot.sendMessage(chatId, "❌ Eroare Meteo."); }
    }

    // 2. Creierul OpenRouter (Folosind cheia ta)
    try {
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-flash-1.5-exp", // Rapid și moca
            messages: [{ role: "user", content: msg.text }]
        }, {
            headers: { "Authorization": `Bearer ${openRouterKey}`, "Content-Type": "application/json" }
        });
        
        const aiReply = response.data.choices[0].message.content;
        bot.sendMessage(chatId, aiReply);
    } catch (err) {
        bot.sendMessage(chatId, "⚠️ Creierul e ocupat, revin imediat.");
    }
});

// Păstrăm serverul viu pe Render
http.createServer((req, res) => res.end('NEXUS ONLINE')).listen(process.env.PORT || 10000);

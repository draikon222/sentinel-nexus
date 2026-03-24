const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const axios = require('axios');
const http = require('http');

// Încărcăm variabilele tale din Render
const token = process.env.TELEGRAM_TOKEN;
const mongoUri = process.env.MONGO_URI;
const groqKey = process.env.GROQ_API_KEY;
const weatherKey = process.env.WEATHER_API_KEY;

// 1. CONECTARE MONGODB (Memorie Persistentă)
mongoose.connect(mongoUri)
    .then(() => console.log("✅ Bază de date MongoDB conectată"))
    .catch(err => console.error("❌ Eroare DB:", err));

const User = mongoose.model('User', new mongoose.Schema({
    chatId: { type: Number, unique: true },
    username: String,
    balance: { type: Number, default: 0 }
}));

// 2. CONFIGURARE BOT (Forțăm curățarea conflictelor 409)
const bot = new TelegramBot(token, { polling: true });
const groq = new Groq({ apiKey: groqKey });

// Ștergem orice webhook vechi care ar putea cauza Conflict 409
bot.deleteWebHook({ drop_pending_updates: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text) return;
    const input = msg.text.trim();

    // Înregistrăm user-ul în baza de date
    await User.findOneAndUpdate({ chatId }, { chatId, username: msg.from.username }, { upsert: true });

    // 3. COMANDA METEO (Folosind cheia ta)
    if (input.toLowerCase().startsWith("vremea")) {
        const oras = input.replace(/vremea in|vremea în|vremea/gi, "").trim() || "Vaslui";
        try {
            const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${weatherKey}&lang=ro`);
            const d = res.data;
            return bot.sendMessage(chatId, `🌦️ În ${d.name}: ${d.weather[0].description}, 🌡️ ${d.main.temp}°C.`);
        } catch (e) {
            return bot.sendMessage(chatId, `❌ Nu am găsit vremea pentru: ${oras}`);
        }
    }

    // 4. CREIERUL GROQ (Rapid și stabil)
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama-3.1-8b-instant', // Modelul tău ultra-rapid
            temperature: 0.7
        });
        bot.sendMessage(chatId, chatCompletion.choices[0].message.content);
    } catch (err) {
        console.error("Eroare Groq:", err.message);
        bot.sendMessage(chatId, "⚠️ Eroare temporară la AI. Încearcă din nou.");
    }
});

// Păstrăm serverul viu pe Render pentru a evita Sleep
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS GROQ DB ACTIVE');
}).listen(process.env.PORT || 10000);

// Tratăm erorile de Polling fără să crape botul
bot.on('polling_error', (err) => console.log("Se reconectează..."));

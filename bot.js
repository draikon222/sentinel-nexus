const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const axios = require('axios');
const http = require('http');

// Extragere variabile din mediu
const token = process.env.TELEGRAM_TOKEN;
const mongoUri = process.env.MONGO_URI;
const groqKey = process.env.GROQ_API_KEY;
const weatherKey = process.env.WEATHER_API_KEY;

// 1. Conexiune Bază de Date (Esențială pentru stabilitate)
mongoose.connect(mongoUri)
    .then(() => console.log("✅ Bază de date OK"))
    .catch(err => console.error("❌ Eroare MongoDB:", err));

const User = mongoose.model('User', new mongoose.Schema({
    chatId: { type: Number, unique: true },
    username: String,
    balance: { type: Number, default: 0 }
}));

// 2. Inițializare Bot cu protecție anti-conflict
const bot = new TelegramBot(token, { polling: true });
const groq = new Groq({ apiKey: groqKey });

// Curățăm orice sesiune anterioară blocată
bot.deleteWebHook({ drop_pending_updates: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text) return;
    const input = msg.text.trim();

    // Salvare automată în DB
    await User.findOneAndUpdate({ chatId }, { chatId, username: msg.from.username }, { upsert: true });

    // 3. Comandă Meteo (Vaslui implicit)
    if (input.toLowerCase().startsWith("vremea")) {
        const oras = input.replace(/vremea in|vremea în|vremea/gi, "").trim() || "Vaslui";
        try {
            const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${weatherKey}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${res.data.name}: ${res.data.weather[0].description}, 🌡️ ${res.data.main.temp}°C.`);
        } catch (e) {
            return bot.sendMessage(chatId, "❌ Orașul nu a fost găsit.");
        }
    }

    // 4. Procesare AI via Groq (Llama 3.1 - Ultra Rapid)
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama-3.1-8b-instant'
        });
        bot.sendMessage(chatId, chatCompletion.choices[0].message.content);
    } catch (err) {
        console.error("Groq Error");
        bot.sendMessage(chatId, "⚠️ Sistemul AI este momentan indisponibil.");
    }
});

// 5. Server HTTP pentru Render (Previne oprirea botului)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_ONLINE');
}).listen(process.env.PORT || 10000);

// Gestionare erori critice fără crash
bot.on('polling_error', (err) => console.log("Se reîncearcă conexiunea..."));
process.on('uncaughtException', (err) => console.error("Eroare ignorată pentru stabilitate"));

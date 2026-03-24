const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

const token = '8449650506:AAFGrNk9Rj4Xcl-zSEp66R0QzuELbZ51uNI';
const bot = new TelegramBot(token, { polling: true });

// Forțăm citirea curată a cheii
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY.trim() });

bot.deleteWebHook({ drop_pending_updates: true }).then(() => {
    console.log("🛡️ NEXUS: Sesiune curată. Groq se inițializează...");
});

bot.on('message', async (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    const input = msg.text.trim();

    // LOGICĂ METEO
    if (input.toLowerCase().includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const w = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${process.env.WEATHER_API_KEY.trim()}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${oras.toUpperCase()}: ${w.data.weather[0].description}, ${w.data.main.temp}°C.`);
        } catch (e) { return bot.sendMessage(chatId, `❌ Orașul "${oras}" nu a fost găsit.`); }
    }

    // LOGICĂ GROQ (DETALIATĂ)
    try {
        const chat = await groq.chat.completions.create({
            messages: [{ role: 'user', content: msg.text }],
            model: 'llama3-8b-8192'
        });
        bot.sendMessage(chatId, chat.choices[0].message.content);
    } catch (e) {
        // Îți va trimite eroarea exactă pe Telegram să vedem ce are
        bot.sendMessage(chatId, `⚠️ EROARE GROQ: ${e.message}`);
    }
});

http.createServer((req, res) => { res.end('Nexus Active'); }).listen(process.env.PORT || 10000);

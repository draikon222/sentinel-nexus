const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

// CONFIGURARE
const TELEGRAM_TOKEN = 'AICI_PUI_NOUL_TOKEN_DE_LA_BOTFATHER'; // <--- SCHIMBĂ-L PE ĂSTA!
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const groq = new Groq({ 
    apiKey: (process.env.GROQ_API_KEY || '').trim() 
});

// CURĂȚARE SESIUNI VECHI (Antidot pentru eroarea 409)
bot.deleteWebHook({ drop_pending_updates: true }).then(() => {
    console.log("🛡️ NEXUS: Token nou activat. Sistemul e LIVE pe Llama 3.1.");
});

bot.on('message', async (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    const input = msg.text.trim();

    // 🌦️ LOGICĂ METEO
    if (input.toLowerCase().startsWith("vremea")) {
        const oras = input.replace(/vremea in|vremea în|vremea/gi, "").trim();
        if (!oras) return bot.sendMessage(chatId, "Zi-mi și orașul (ex: vremea Vaslui).");

        try {
            const wUrl = `https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${process.env.WEATHER_API_KEY.trim()}&lang=ro`;
            const res = await axios.get(wUrl);
            const d = res.data;
            return bot.sendMessage(chatId, `🌦️ În ${d.name.toUpperCase()}: ${d.weather[0].description}, 🌡️ ${d.main.temp}°C.`);
        } catch (e) { 
            return bot.sendMessage(chatId, `❌ Nu am găsit informații pentru: ${oras}`); 
        }
    }

    // 🧠 INTELIGENȚĂ AI (Llama 3.1 - Verificat)
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama-3.1-8b-instant', // Modelul nou care a înlocuit versiunea scoasă
            temperature: 0.7,
        });
        const raspuns = chatCompletion.choices[0].message.content;
        bot.sendMessage(chatId, raspuns);
    } catch (err) {
        console.error("Eroare Groq:", err.message);
        bot.sendMessage(chatId, `🚨 EROARE GROQ: ${err.message}`);
    }
});

// Server obligatoriu pentru Render
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS STABLE IS RUNNING');
}).listen(process.env.PORT || 10000);

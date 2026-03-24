const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

const token = '8449650506:AAFGrNk9Rj4Xcl-zSEp66R0QzuELbZ51uNI';
const bot = new TelegramBot(token, { polling: true });

const groq = new Groq({ 
    apiKey: (process.env.GROQ_API_KEY || '').trim() 
});

bot.deleteWebHook({ drop_pending_updates: true }).then(() => {
    console.log("🛡️ NEXUS: Sesiune curățată. Model actualizat la Llama 3.1.");
});

bot.on('message', async (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    const input = msg.text.trim();

    // 1. METEO
    if (input.toLowerCase().includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const w = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${process.env.WEATHER_API_KEY.trim()}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${oras.toUpperCase()}: ${w.data.weather[0].description}, ${w.data.main.temp}°C.`);
        } catch (e) { return bot.sendMessage(chatId, "❌ Oraș negăsit."); }
    }

    // 2. AI GROQ (Llama 3.1)
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama-3.1-8b-instant', // Modelul nou, activ
        });
        bot.sendMessage(chatId, chatCompletion.choices[0].message.content);
    } catch (err) {
        bot.sendMessage(chatId, `🚨 EROARE GROQ: ${err.message}`);
    }
});

http.createServer((req, res) => { res.end('Nexus Active'); }).listen(process.env.PORT || 10000);

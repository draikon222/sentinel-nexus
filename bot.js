const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

const token = '8449650506:AAFGrNk9Rj4Xcl-zSEp66R0QzuELbZ51uNI';
const bot = new TelegramBot(token, { polling: true });

// Inițializăm Groq cu cheia ta nouă (gsk_...)
const groq = new Groq({ 
    apiKey: (process.env.GROQ_API_KEY || '').trim() 
});

bot.deleteWebHook({ drop_pending_updates: true }).then(() => {
    console.log("🛡️ NEXUS: Sistem resetat complet.");
});

bot.on('message', async (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    const input = msg.text.trim();

    // 1. TEST METEO (Verificăm dacă măcar API-ul Weather merge)
    if (input.toLowerCase().includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const w = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${process.env.WEATHER_API_KEY.trim()}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${oras.toUpperCase()}: ${w.data.weather[0].description}, ${w.data.main.temp}°C.`);
        } catch (e) { return bot.sendMessage(chatId, `❌ Eroare Meteo: ${e.message}`); }
    }

    // 2. TEST AI (Fără mesaje de tip "Offline", doar eroarea brută)
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama3-8b-8192', // Modelul cel mai stabil pentru conturi noi
        });
        bot.sendMessage(chatId, chatCompletion.choices[0].message.content);
    } catch (err) {
        // Aici Nexus îți va spune EXACT ce nu-i convine:
        bot.sendMessage(chatId, `🚨 EROARE GROQ: ${err.message}`);
        console.error(err);
    }
});

// Port pentru Render
http.createServer((req, res) => { res.end('Nexus Debug Active'); }).listen(process.env.PORT || 10000);

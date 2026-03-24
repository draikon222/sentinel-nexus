const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

// CONFIGURARE VARIABILE
const token = (process.env.TELEGRAM_TOKEN || '').trim();
const groqKey = (process.env.GROQ_API_KEY || '').trim();
const weatherKey = (process.env.WEATHER_API_KEY || '').trim();

const bot = new TelegramBot(token, { polling: true });
const groq = new Groq({ apiKey: groqKey });

// Mesaj de confirmare în consolă
console.log("🚀 NEXUS: Pornire sistem...");

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text) return;
    
    const input = msg.text.trim();
    console.log(`📩 Primit: ${input}`);

    // TEST RAPID - Răspunde imediat la "ping"
    if (input.toLowerCase() === 'ping') {
        return bot.sendMessage(chatId, "PONG! Sunt online și te aud.");
    }

    // LOGICĂ METEO
    if (input.toLowerCase().includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${weatherKey}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${res.data.name}: ${res.data.weather[0].description}, ${res.data.main.temp}°C.`);
        } catch (e) {
            return bot.sendMessage(chatId, "❌ Oraș negăsit sau eroare API.");
        }
    }

    // AI GROQ (Llama 3.1)
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama-3.1-8b-instant',
        });
        bot.sendMessage(chatId, chatCompletion.choices[0].message.content);
    } catch (err) {
        console.error("Eroare Groq:", err.message);
        bot.sendMessage(chatId, "⚠️ Sunt puțin obosit, mai întreabă-mă o dată.");
    }
});

// Port pentru Render (Păstrează serviciul activ)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS STABLE');
}).listen(process.env.PORT || 10000);

// Tratare erori să nu moară botul de tot
bot.on('polling_error', (err) => console.log("Polling error:", err.code));

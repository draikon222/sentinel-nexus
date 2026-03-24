const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

// Curățăm orice sesiune anterioară și pornim botul
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
    polling: {
        params: { timeout: 10 },
        autoStart: true
    } 
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log("🛡️ NEXUS: Inițiez restart sistem...");

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text) return;

    const input = msg.text.trim();

    // Logică Meteo Directă
    if (input.toLowerCase().includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const w = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${process.env.WEATHER_API_KEY.trim()}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${oras.toUpperCase()}: ${w.data.weather[0].description}, ${w.data.main.temp}°C.`);
        } catch (e) {
            return bot.sendMessage(chatId, `❌ Nu am găsit orașul ${oras}.`);
        }
    }

    // Inteligență Groq (Llama 3)
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama3-8b-8192',
        });
        bot.sendMessage(chatId, chatCompletion.choices[0].message.content);
    } catch (e) {
        bot.sendMessage(chatId, "⚠️ Groq e offline. Verifică API Key-ul.");
    }
});

// Port obligatoriu pentru Render să nu mai dea timeout
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Nexus is Operational');
});
server.listen(process.env.PORT || 10000, () => {
    console.log("✅ Server port binding succesful.");
});

// Tratare erori de polling pentru a evita crash-ul total
bot.on('polling_error', (error) => {
    if (error.code === 'EFATAL') {
        console.log("Eroare fatală, repornesc...");
    }
});

const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

const token = '8449650506:AAFGrNk9Rj4Xcl-zSEp66R0QzuELbZ51uNI';
const bot = new TelegramBot(token, { polling: false }); 

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// FUNCȚIA CARE OMOARĂ CONFLICTUL 409
async function forceStart() {
    console.log("🛡️ NEXUS: Distrug sesiunile vechi...");
    try {
        await bot.deleteWebHook({ drop_pending_updates: true });
        console.log("🛡️ NEXUS: Sesiuni curățate.");
        bot.startPolling(); 
    } catch (e) {
        console.log("Eroare la curățare:", e.message);
    }
}

forceStart();

bot.on('message', async (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    const input = msg.text.trim();

    if (input.toLowerCase().includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const w = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${process.env.WEATHER_API_KEY}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${oras.toUpperCase()}: ${w.data.weather[0].description}, ${w.data.main.temp}°C.`);
        } catch (e) { return bot.sendMessage(chatId, "❌ Oraș negăsit."); }
    }

    try {
        const chat = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama3-8b-8192'
        });
        bot.sendMessage(chatId, chat.choices[0].message.content);
    } catch (e) { bot.sendMessage(chatId, "⚠️ Eroare Groq."); }
});

http.createServer((req, res) => { res.end('Nexus Active'); }).listen(process.env.PORT || 10000);

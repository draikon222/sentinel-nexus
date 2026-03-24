const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

// TOKEN NOU HARDCODAT PENTRU SIGURANȚĂ
const token = '8449650506:AAFGrNk9Rj4Xcl-zSEp66R0QzuELbZ51uNI';
const bot = new TelegramBot(token, { polling: false }); // Pornim fără polling inițial

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function startBot() {
    try {
        console.log("🛡️ NEXUS: Curățare forțată sesiuni...");
        await bot.deleteWebHook({ drop_pending_updates: true });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Pauză de siguranță
        
        bot.startPolling();
        console.log("🛡️ NEXUS: Bot activ și curat.");
    } catch (e) { console.log("Eroare la pornire:", e.message); }
}

startBot();

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text) return;

    const input = msg.text.trim();

    // METEO
    if (input.toLowerCase().includes("vremea")) {
        const oras = input.split(" ").pop();
        try {
            const w = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${process.env.WEATHER_API_KEY}&lang=ro`);
            return bot.sendMessage(chatId, `🌦️ În ${oras.toUpperCase()}: ${w.data.weather[0].description}, ${w.data.main.temp}°C.`);
        } catch (e) { return bot.sendMessage(chatId, "❌ Oraș negăsit."); }
    }

    // GROQ
    try {
        const chat = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama3-8b-8192'
        });
        bot.sendMessage(chatId, chat.choices[0].message.content);
    } catch (e) { bot.sendMessage(chatId, "⚠️ Eroare Groq."); }
});

// Port obligatoriu pentru Render
http.createServer((req, res) => { res.end('Nexus Active'); }).listen(process.env.PORT || 10000);

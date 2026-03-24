const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const axios = require('axios');
const http = require('http');

const token = (process.env.TELEGRAM_TOKEN || '').trim();
const groqKey = (process.env.GROQ_API_KEY || '').trim();
const weatherKey = (process.env.WEATHER_API_KEY || '').trim();

const bot = new TelegramBot(token, { polling: true });
const groq = new Groq({ apiKey: groqKey });

console.log("🚀 NEXUS EVO: Online cu Generare Imagini.");

bot.deleteWebHook({ drop_pending_updates: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text) return;
    const input = msg.text.trim();

    // 🎨 FUNCȚIE NOUĂ: GENERARE IMAGINI
    if (input.toLowerCase().startsWith("imagine")) {
        const prompt = input.replace("imagine", "").trim();
        if (!prompt) return bot.sendMessage(chatId, "Zi-mi ce vrei să desenez (ex: imagine un leu pe lună).");

        try {
            bot.sendMessage(chatId, "🎨 Nexus pictează pentru tine...");
            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;
            return bot.sendPhoto(chatId, imageUrl, { caption: `✅ Generat pentru: ${prompt}` });
        } catch (e) {
            return bot.sendMessage(chatId, "❌ Eroare la generarea imaginii.");
        }
    }

    // 🌦️ VREMEA
    if (input.toLowerCase().startsWith("vremea")) {
        const oras = input.replace(/vremea in|vremea în|vremea/gi, "").trim() || "Vaslui";
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${oras}&units=metric&appid=${weatherKey}&lang=ro`;
            const res = await axios.get(url);
            const d = res.data;
            return bot.sendMessage(chatId, `🌦️ În ${d.name}: ${d.weather[0].description}, 🌡️ ${d.main.temp}°C.`);
        } catch (e) {
            return bot.sendMessage(chatId, "❌ Nu am găsit orașul.");
        }
    }

    // 🧠 AI (Llama 3.1)
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: input }],
            model: 'llama-3.1-8b-instant'
        });
        bot.sendMessage(chatId, chatCompletion.choices[0].message.content);
    } catch (err) {
        bot.sendMessage(chatId, "⚠️ Eroare la procesarea AI.");
    }
});

http.createServer((req, res) => { res.end('NEXUS STABLE'); }).listen(process.env.PORT || 10000);

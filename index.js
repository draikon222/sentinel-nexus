const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// Îl ținem treaz
http.createServer((req, res) => { res.end('Nexus Reborn'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.on('message', async (ctx) => {
    // Verificăm ID-ul tău direct
    if (ctx.from.id.toString() !== process.env.MY_ID) return;

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Ești Draikon Nexus. Tăios, realist, loial lui Broo. Fără politețuri. Distruge orice dubiu despre Sentinel Core." },
                { role: "user", content: ctx.message.text || "Salut" }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        ctx.reply(response.data.choices[0].message.content);
    } catch (e) {
        console.log("EROARE GROQ: " + e.message);
        ctx.reply("Băi Broo, am o eroare la creier: " + e.message);
    }
});

bot.launch().then(() => console.log("Nexus e viu!"));

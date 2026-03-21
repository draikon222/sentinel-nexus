const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// 1. Server HTTP (Vital pentru Render)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_LIVESTREAM');
}).listen(process.env.PORT || 3000);

// 2. Configurare Nexus
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;
const apiKey = process.env.OPENROUTER_KEY;

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;

    const waitingMsg = await ctx.reply("🌀 Nexus accesează nucleul Llama...");

    try {
        const response = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: { 
                'Authorization': `Bearer ${apiKey.trim()}`, 
                'Content-Type': 'application/json'
            },
            data: {
                // MODEL GRATUIT ȘI STABIL (Fără erori de versiune)
                model: "meta-llama/llama-3-8b-instruct:free", 
                messages: [
                    { 
                        role: "system", 
                        content: "Ești Nexus. Intelect Universal. Tăios și brutal de sincer. Planuri de execuție reci." 
                    },
                    { role: "user", content: ctx.message.text }
                ]
            }
        });

        const reply = response.data.choices[0].message.content;
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, reply);

    } catch (e) {
        console.error("Eroare:", e.message);
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Modelul e ocupat. Reîncearcă în câteva secunde.");
    }
});

// 3. Pornire
bot.launch()
    .then(() => console.log("🚀 Nexus este ONLINE pe Llama!"))
    .catch(err => console.error("Eroare fatală:", err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

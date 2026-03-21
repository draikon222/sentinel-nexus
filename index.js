const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// 1. Server HTTP (Menține Render activ)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_FAST_MODE');
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;
const apiKey = process.env.OPENROUTER_KEY;

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;

    const waitingMsg = await ctx.reply("🌀 Nexus forțează nucleul rapid (Qwen)...");

    try {
        const response = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            timeout: 25000, // Nu stăm mai mult de 25 secunde
            headers: { 
                'Authorization': `Bearer ${apiKey.trim()}`, 
                'Content-Type': 'application/json'
            },
            data: {
                // MODEL ULTRA-RAPID (Trafic minim, răspuns instant)
                model: "alibaba/qwen-2-7b-instruct:free", 
                messages: [
                    { role: "system", content: "Ești Nexus. Intelect Universal. Tăios și eficient." },
                    { role: "user", content: ctx.message.text }
                ]
            }
        });

        const reply = response.data.choices[0].message.content;
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, reply);

    } catch (e) {
        console.error("Eroare:", e.message);
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Serverele gratuite sunt sub asediu. Mai încearcă un 'Hei' peste 30 de secunde.");
    }
});

bot.launch()
    .then(() => console.log("🚀 Nexus a pornit în MOD RAPID!"))
    .catch(err => console.error("Eroare:", err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

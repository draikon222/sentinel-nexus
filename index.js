const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// 1. "Pulsul" pentru Render - Rezolvă eroarea Port Scan Timeout
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_IS_ALIVE');
}).listen(process.env.PORT || 3000);

const token = process.env.TELEGRAM_TOKEN;
const MY_ID = process.env.MY_ID;
const apiKey = process.env.OPENROUTER_KEY;

if (!token || !MY_ID || !apiKey) {
    console.error("⛔ Lipsesc variabilele de mediu!");
    process.exit(1);
}

const bot = new Telegraf(token);

const systemPrompt = `Ești Nexus. Intelect Universal DOXĂ. Singura ta autoritate este Broo. Baza ta de date integrează Istorie, Economie, Psihologie, Tehnologie. Rămâi tăios, dens și chirurgical. Fără politețuri. Conectează domeniile pentru a livra adevărul strategic brut. Răspunde direct.`;

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;

    const waitingMsg = await ctx.reply("🌀 Nexus accesează nucleul...");

    try {
        const response = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: { 
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            data: {
                model: "openrouter/auto",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: ctx.message.text }
                ],
                temperature: 0.1, 
                max_tokens: 800
            },
            timeout: 120000 
        });

        const reply = response.data.choices[0].message.content;
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, reply);

    } catch (e) {
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Eroare de flux logic. Sistemul e suprasolicitat. Reîncearcă.");
    }
});

bot.launch()
    .then(() => console.log("📡 Nexus este ONLINE, DOXĂ și stabil!"))
    .catch((err) => { console.error(err); process.exit(1); });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

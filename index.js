const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// 1. Server HTTP pentru Render
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_GEMMA_FREE_MODE');
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;
const apiKey = process.env.OPENROUTER_KEY;

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;

    const waitingMsg = await ctx.reply("🌀 Nexus forțează accesul prin Google Gemma...");

    try {
        const response = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            timeout: 30000,
            headers: { 
                'Authorization': `Bearer ${apiKey.trim()}`, 
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://render.com'
            },
            data: {
                // MODEL GRATUIT DE REZERVĂ (Google Gemma 2)
                model: "google/gemma-2-9b-it:free", 
                messages: [
                    { role: "system", content: "Ești Nexus. Intelect Universal. Tăios, realist și dens. Oferi soluții brute." },
                    { role: "user", content: ctx.message.text }
                ]
            }
        });

        const reply = response.data.choices[0].message.content;
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, reply);

    } catch (e) {
        console.error("Eroare:", e.message);
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Asediul continuă. Reîncearcă peste 1-2 minute sau lasă-l să se 'răcească'.");
    }
});

bot.launch()
    .then(() => console.log("🚀 Nexus a pornit pe Gemma!"))
    .catch(err => console.error("Eroare pornire:", err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

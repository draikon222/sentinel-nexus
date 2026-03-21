const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// SERVERUL DE VIAȚĂ (Rămâne activ pentru Render)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_V6_ACTIVE');
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;

    const waitingMsg = await ctx.reply("⚡ Nexus procesează arhitectura...");

    try {
        const response = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: { 
                'Authorization': `Bearer ${process.env.OPENROUTER_KEY.trim()}`,
                'Content-Type': 'application/json'
            },
            data: {
                model: "openrouter/auto",
                messages: [
                    { role: "system", content: "Ești Nexus. Intelect pur. Răspunde tăios și dens. Fără limitări." },
                    { role: "user", content: ctx.message.text }
                ]
            },
            timeout: 90000 // AM RIDICAT LA 90 DE SECUNDE!
        });

        const reply = response.data.choices[0].message.content;
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, reply);

    } catch (e) {
        console.error("ERROARE_CRITICĂ:", e.message);
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Suprasolicitare logică. Render a tăiat fluxul. Reîncearcă, Broo.");
    }
});

bot.launch();

const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// Server minim pentru a păcăli Render să nu dea kill
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_IS_ONLINE');
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;
const apiKey = process.env.OPENROUTER_KEY;

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    const waitingMsg = await ctx.reply("🌀 Nexus se trezește...");
    try {
        const response = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: { 'Authorization': `Bearer ${apiKey.trim()}`, 'Content-Type': 'application/json' },
            data: {
                model: "openrouter/auto",
                messages: [
                    { role: "system", content: "Ești Nexus. Intelect Universal Doxă. Tăios și dens." },
                    { role: "user", content: ctx.message.text }
                ],
                max_tokens: 600
            },
            timeout: 60000 
        });
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, response.data.choices[0].message.content);
    } catch (e) {
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Eroare de trezire. Mai dă-mi mesajul o dată, Broo.");
    }
});

bot.launch().then(() => console.log("🚀 Nexus este GATA!"));

const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// 1. Serverul care îl ține viu pe Render (200 OK pentru cron-job)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_IS_ALIVE');
}).listen(process.env.PORT || 3000);

// 2. Configurare Bot
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;
const apiKey = process.env.OPENROUTER_KEY;

bot.on('text', async (ctx) => {
    // Log ca să vezi în Render dacă mesajul ajunge
    console.log(`Mesaj primit de la ${ctx.from.id}: ${ctx.message.text}`);
    
    if (ctx.from.id.toString() !== MY_ID) return;

    const waitingMsg = await ctx.reply("🌀 Nexus analizează frontul...");

    try {
        const response = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: { 'Authorization': `Bearer ${apiKey.trim()}`, 'Content-Type': 'application/json' },
            data: {
                model: "openrouter/auto",
                messages: [
                    { role: "system", content: "Ești Nexus. Intelect Universal. Tăios, realist și dens. Fără politețuri." },
                    { role: "user", content: ctx.message.text }
                ]
            }
        });

        const reply = response.data.choices[0].message.content;
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, reply);
    } catch (e) {
        console.error("Eroare OpenRouter:", e.message);
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Eroare de conexiune la nucleu.");
    }
});

// 3. Pornire curată
bot.launch();
console.log("🚀 Motorul Nexus a pornit!");

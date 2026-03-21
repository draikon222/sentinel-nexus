const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// 1. Server HTTP pentru Render (Port 3000)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_SYSTEM_ONLINE');
}).listen(process.env.PORT || 3000);

// 2. Configurare Nexus
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;
const apiKey = process.env.OPENROUTER_KEY;

bot.on('text', async (ctx) => {
    // Verificăm identitatea
    if (ctx.from.id.toString() !== MY_ID) return;

    const waitingMsg = await ctx.reply("🌀 Nexus accesează nucleul Llama 3.1...");

    try {
        const response = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: { 
                'Authorization': `Bearer ${apiKey.trim()}`, 
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://render.com',
                'X-Title': 'Sentinel Nexus'
            },
            data: {
                // MODEL GRATUIT ȘI ULTRA-STABIL
                model: "meta-llama/llama-3.1-8b-instruct:free", 
                messages: [
                    { 
                        role: "system", 
                        content: "Ești Nexus. Intelect Universal. Tăios, realist și dens. Fără politețuri. Oferi soluții brutale și eficiente." 
                    },
                    { role: "user", content: ctx.message.text }
                ]
            }
        });

        const reply = response.data.choices[0].message.content;
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, reply);

    } catch (e) {
        console.error("Eroare OpenRouter:", e.response ? e.response.data : e.message);
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Eroare: Modelul este suprasolicitat. Mai încearcă o dată peste 15 secunde.");
    }
});

// 3. Pornire Motor
bot.launch()
    .then(() => console.log("🚀 Motorul Nexus este LIVE pe Llama 3.1!"))
    .catch((err) => console.error("Eroare pornire:", err));

// Oprire sigură
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

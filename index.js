const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// 1. Server HTTP (Vital pentru a opri Render din a da erori de port)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_ULTIMATE_FREE');
}).listen(process.env.PORT || 3000);

// 2. Configurare Nexus
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;
const apiKey = process.env.OPENROUTER_KEY;

bot.on('text', async (ctx) => {
    // Verificare identitate
    if (ctx.from.id.toString() !== MY_ID) return;

    const waitingMsg = await ctx.reply("🌀 Nexus accesează nucleul de rezervă...");

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
                // MODEL GRATUIT CU TRAFIC MIC (Evităm eroarea de ocupat)
                model: "gryphe/mythomist-7b:free", 
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
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Eroare temporară de trafic. Mai apasă o dată pe mesaj peste 10 secunde.");
    }
});

// 3. Pornire Motor
bot.launch()
    .then(() => console.log("🚀 Motorul Nexus este ONLINE pe Mythomist!"))
    .catch((err) => console.error("Eroare pornire:", err));

// Oprire sigură
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

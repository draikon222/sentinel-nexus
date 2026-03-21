const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// 1. Server HTTP pentru a menține Render activ (Port 3000)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_IS_ALIVE');
}).listen(process.env.PORT || 3000);

// 2. Inițializare Bot cu noul Token
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;
const apiKey = process.env.OPENROUTER_KEY;

bot.on('text', async (ctx) => {
    // Verificăm dacă mesajul vine de la tine
    if (ctx.from.id.toString() !== MY_ID) return;

    const waitingMsg = await ctx.reply("🌀 Nexus accesează nucleul gratuit...");

    try {
        const response = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: { 
                'Authorization': `Bearer ${apiKey.trim()}`, 
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://render.com', // Cerut uneori de OpenRouter
                'X-Title': 'Sentinel Nexus'
            },
            data: {
                // MODEL GRATUIT: Nu cere bani în contul OpenRouter
                model: "mistralai/mistral-7b-instruct:free", 
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
        console.error("Eroare Nucleu:", e.response ? e.response.data : e.message);
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Eroare: Modelul gratuit este supraîncărcat. Reîncearcă în 10 secunde.");
    }
});

// 3. Lansare Motor
bot.launch()
    .then(() => console.log("🚀 Motorul Nexus a pornit!"))
    .catch((err) => console.error("Eroare la pornire:", err));

// Oprire grațioasă
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

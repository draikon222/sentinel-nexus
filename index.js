const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// 1. Server HTTP (Vital pentru Render)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_SYSTEM_GROQ_ACTIVE');
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;
// Cheia de la Groq trebuie adăugată în Render Environment Variables ca: GROQ_API_KEY
const apiKey = process.env.GROQ_API_KEY; 

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;

    const waitingMsg = await ctx.reply("🌀 Nexus accesează nucleul Groq (Ultra-Speed)...");

    try {
        const response = await axios({
            method: 'post',
            url: 'https://api.groq.com/openai/v1/chat/completions',
            headers: { 
                'Authorization': `Bearer ${apiKey}`, 
                'Content-Type': 'application/json'
            },
            data: {
                // Llama 3.3 70B pe Groq e GRATUIT acum și extrem de deștept
                model: "llama-3.3-70b-versatile", 
                messages: [
                    { 
                        role: "system", 
                        content: "Ești Nexus. Intelect Universal. Brațul de execuție pentru Sentinel Core. Tăios, realist, fără politețuri. Identifici puncte critice și oferi planuri de cucerire." 
                    },
                    { role: "user", content: ctx.message.text }
                ]
            }
        });

        const reply = response.data.choices[0].message.content;
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, reply);

    } catch (e) {
        console.error("Eroare Groq:", e.message);
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Eroare: Sistemul e la limită. Reîncearcă în 30 de secunde.");
    }
});

bot.launch().then(() => console.log("🚀 Nexus este ONLINE pe infrastructura Groq!"));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

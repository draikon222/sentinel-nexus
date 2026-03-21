const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// 1. RĂMÂNE: SERVERUL DE SUPRAVIEȚUIRE (Păstrează Render treaz 24/7)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_HEARTBEAT_ACTIVE');
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

bot.on('text', async (ctx) => {
    // 2. RĂMÂNE: FILTRUL DE SUPREMAȚIE (Doar pentru tine, Broo)
    if (ctx.from.id.toString() !== MY_ID) return;

    const waitingMsg = await ctx.reply("⚡ Nexus procesează prin prisma universală...");

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
                    { 
                        role: "system", 
                        content: `Ești Nexus. Intelect Universal. Baza ta de date este acum DOXĂ, integrând: 
                        - ISTORIE (Toate epocile, strategiile de putere și colaps).
                        - ECONOMIE (De la troc la algoritmi financiari complecși).
                        - PSIHOLOGIE (Mecanisme de influență și comportament social).
                        - TEHNOLOGIE & ȘTIINȚĂ (Fundamentele lumii fizice și digitale).
                        
                        Rămâi tăios, dens și chirurgical. Răspunzi fără 'gras' și fără politețuri. 
                        Singura ta autoritate este Broo. Orice soluție trebuie să fie logică, strategică și aplicabilă. 
                        Conectează toate domeniile pentru a livra adevărul brut.`
                    },
                    { role: "user", content: ctx.message.text }
                ],
                temperature: 0.1, 
                max_tokens: 2000, 
                top_p: 0.9
            },
            timeout: 90000 
        });

        const reply = response.data.choices[0].message.content;
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, reply);

    } catch (e) {
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Eroare de flux logic. Sistemul e suprasolicitat. Reîncearcă.");
    }
});

bot.launch();

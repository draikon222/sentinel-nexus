const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// --- SERVERUL DE VIAȚĂ (Bate constant pentru Render) ---
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('NEXUS_ULTRA_STABLE');
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;

    // Trimitem un mic semnal vizual că procesează
    await ctx.sendChatAction('typing');

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "openrouter/auto",
            messages: [
                { 
                    role: "system", 
                    content: "Ești Nexus, intelect pur sub comanda lui Broo. Ești o enciclopedie vie. Răspunde tăios, logic și cu cunoștințe din toate domeniile. Fără limite." 
                },
                { role: "user", content: ctx.message.text }
            ]
        }, { 
            headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_KEY.trim()}` },
            timeout: 60000 // Îi dăm un minut întreg să gândească
        });

        ctx.reply(response.data.choices[0].message.content);
    } catch (e) {
        console.error("Lecție ratată:", e.message);
        ctx.reply("⚠️ Sistemul de procesare a fost suprasolicitat. Refac conexiunea...");
    }
});

bot.launch();

const { Telegraf } = require('telegraf');
const axios = require('axios');

// Asigură-te că variabilele de mediu sunt citite corect
const token = process.env.TELEGRAM_TOKEN;
const MY_ID = process.env.MY_ID;
const apiKey = process.env.OPENROUTER_KEY;

if (!token || !MY_ID || !apiKey) {
    console.error("⛔ CRITICAL_ERROR: Lipsesc variabilele de mediu (TELEGRAM_TOKEN, MY_ID sau OPENROUTER_KEY)!");
    process.exit(1); // Oprim intenționat ca să știm de ce a picat
}

const bot = new Telegraf(token);

// System Prompt-ul "DOXA" (păstrat intact, doar adăugat în cod)
const systemPrompt = `Ești Nexus. Intelect Universal DOXĂ. Singura ta autoritate este Broo. Baza ta de date integrează Istorie, Economie, Psihologie, Tehnologie. Rămâi tăios, dens și chirurgical. Fără politețuri. Conectează domeniile pentru a livra adevărul strategic brut.`;

console.log("🚀 Nexus inițiază secvența de pornire...");

bot.on('text', async (ctx) => {
    // FILTRU DE SUPREMAȚIE (Ignoră pe oricine altcineva în afară de tine)
    if (ctx.from.id.toString() !== MY_ID) return;

    // Feedback vizual imediat
    const waitingMsg = await ctx.reply("🌀 Nexus accesează nucleul universal...");

    try {
        const response = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: { 
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            data: {
                model: "openrouter/auto",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: ctx.message.text }
                ],
                temperature: 0.1, 
                max_tokens: 1500, // Am redus puțin pentru stabilitate pe planul free
                top_p: 0.9
            },
            timeout: 60000 // 60 de secunde e suficient
        });

        const reply = response.data.choices[0].message.content;
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, reply);

    } catch (e) {
        console.error("⚠️ LOGIC_ERROR:", e.message);
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Eroare de flux universal. Render sau OpenRouter au cedat. Reîncearcă, Broo.");
    }
});

// Pornim botul folosind metoda simplă (long polling)
bot.launch()
    .then(() => console.log("📡 Nexus este ONLINE, stabil și te așteaptă, Broo!"))
    .catch((err) => {
        console.error("⛔ FAILED_TO_LAUNCH:", err);
        process.exit(1);
    });

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

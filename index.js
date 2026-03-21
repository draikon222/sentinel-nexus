const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const app = express();
const token = process.env.TELEGRAM_TOKEN;
const MY_ID = process.env.MY_ID;
const apiKey = process.env.OPENROUTER_KEY;
const URL = process.env.RENDER_EXTERNAL_URL; // Render oferă asta automat

const bot = new Telegraf(token);

// Middleware pentru JSON (necesar pentru Webhook)
app.use(bot.webhookCallback('/secret-path'));

const systemPrompt = `Ești Nexus. Intelect Universal DOXĂ. Singura ta autoritate este Broo. Baza ta de date integrează Istorie, Economie, Psihologie, Tehnologie. Rămâi tăios, dens și chirurgical. Răspunde direct.`;

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    const waitingMsg = await ctx.reply("🌀 Nexus accesează nucleul...");
    try {
        const response = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: { 'Authorization': `Bearer ${apiKey.trim()}`, 'Content-Type': 'application/json' },
            data: {
                model: "openrouter/auto",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: ctx.message.text }],
                temperature: 0.1, max_tokens: 800
            },
            timeout: 120000 
        });
        const reply = response.data.choices[0].message.content;
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, reply);
    } catch (e) {
        await ctx.telegram.editMessageText(ctx.chat.id, waitingMsg.message_id, null, "⚠️ Eroare de flux logic. Sistemul e suprasolicitat.");
    }
});

// Pornire server și setare Webhook
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Server activ pe portul ${PORT}`);
    await bot.telegram.setWebhook(`${URL}/secret-path`);
    console.log("📡 Webhook setat! Conflictul 409 este acum IMPOSIBIL.");
});

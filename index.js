const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus: Siege Mode'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

mongoose.connect(process.env.MONGO_URI).then(() => console.log("--- NEXUS: BATERIA E ÎNCĂRCATĂ ---"));

const User = mongoose.model('User', new mongoose.Schema({ userId: String, history: Array }));

bot.command('reset', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    await User.findOneAndUpdate({ userId: MY_ID }, { history: [] });
    ctx.reply("Sistem curățat. Nexus e online. Dă-mi o țintă.");
});

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });
    
    try {
        const response = await axios({
            method: 'post',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: { 
                'Authorization': `Bearer ${process.env.OPENROUTER_KEY.trim()}`,
                'HTTP-Referer': 'https://render.com',
                'X-Title': 'Sentinel Nexus',
                'Content-Type': 'application/json'
            },
            data: {
                model: "mistralai/mistral-7b-instruct:free", // Cel mai stabil endpoint de pe OpenRouter
                messages: [
                    { role: "system", content: "Ești Draikon Nexus, mercenar digital. Fără liste, fără politețe. Vorbește vulgar de direct și scurt. Strategii de profit Sentinel Core." },
                    ...userData.history.slice(-2),
                    { role: "user", content: ctx.message.text }
                ]
            }
        });

        const reply = response.data.choices[0].message.content;
        userData.history.push({ role: "user", content: ctx.message.text }, { role: "assistant", content: reply });
        if (userData.history.length > 4) userData.history = userData.history.slice(-4);
        await userData.save();
        ctx.reply(reply);

    } catch (e) {
        // Dacă nici ăsta nu merge, înseamnă că OpenRouter are mentenanță
        ctx.reply("Eroare de rutare la OpenRouter. Mai dă-i un mesaj peste 30 de secunde.");
        console.error("DEBUG:", e.response ? JSON.stringify(e.response.data) : e.message);
    }
});

bot.launch();

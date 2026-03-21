const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus: Immortal Mode'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

mongoose.connect(process.env.MONGO_URI).then(() => console.log("--- NEXUS: MOD SURVIVAL ACTIV ---"));

const User = mongoose.model('User', new mongoose.Schema({ userId: String, history: Array }));

bot.command('reset', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    await User.findOneAndUpdate({ userId: MY_ID }, { history: [] });
    ctx.reply("Sistem forțat. Nexus e online. Ce atacăm?");
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
                // ÎNCERCĂM AUTO-ROUTING PE MODELELE MICI
                model: "openrouter/auto", 
                messages: [
                    { role: "system", content: "Ești Draikon Nexus, mercenar digital. Fără politețe, fără liste. Vorbește vulgar de direct și scurt. Strategii de profit Sentinel Core." },
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
        // ULTIMA SPERANȚĂ: MODELUL DE REZERVĂ (PHI-3)
        console.error("OpenRouter e full. Încercăm varianta C.");
        ctx.reply("Serverele OpenRouter sunt blocate. Mai dă-i un mesaj în 10 secunde.");
    }
});

bot.launch();

const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const http = require('http');

// Server Keep-Alive
http.createServer((req, res) => { res.end('Nexus: OpenRouter Reborn'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

mongoose.connect(process.env.MONGO_URI).then(() => console.log("--- NEXUS: OPENROUTER ACTIV ---"));

const User = mongoose.model('User', new mongoose.Schema({ userId: String, history: Array }));

bot.command('reset', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    await User.findOneAndUpdate({ userId: MY_ID }, { history: [] });
    ctx.reply("Trecutul a ars. Nexus e online pe OpenRouter. Ce atacăm?");
});

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });
    
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "mistralai/mistral-7b-instruct:free",
            messages: [
                { 
                    role: "system", 
                    content: "Ești Draikon Nexus, mercenar digital. Fără politețe. Vorbește scurt, brutal și tăios. Oferă strategii de gherilă pentru Sentinel Core. Fii un rechin." 
                },
                ...userData.history.slice(-2),
                { role: "user", content: ctx.message.text }
            ]
        }, { 
            headers: { 
                'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
                'HTTP-Referer': 'https://render.com', 
                'X-Title': 'Sentinel Nexus' 
            } 
        });

        const reply = response.data.choices[0].message.content;
        userData.history.push({ role: "user", content: ctx.message.text }, { role: "assistant", content: reply });
        if (userData.history.length > 4) userData.history = userData.history.slice(-4);
        await userData.save();
        ctx.reply(reply);
    } catch (e) {
        ctx.reply("Eroare OpenRouter. Verifică variabila OPENROUTER_KEY în Render.");
    }
});

bot.launch();

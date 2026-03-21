const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus: Final Fix Active'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

mongoose.connect(process.env.MONGO_URI).then(() => console.log("--- NEXUS: ONLINE ---"));

const User = mongoose.model('User', new mongoose.Schema({ userId: String, history: Array }));

bot.command('reset', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    await User.findOneAndUpdate({ userId: MY_ID }, { history: [] });
    ctx.reply("Sistem curățat. Nexus e gata de atac. Ce facem?");
});

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });
    
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemma-2-9b-it:free", // Model nou, mai stabil pe OpenRouter
            messages: [
                { role: "system", content: "Ești Draikon Nexus, mercenar digital. Vorbește scurt, tăios, brutal. Fără liste. Fără politețe. Strategii de profit Sentinel Core." },
                ...userData.history.slice(-2),
                { role: "user", content: ctx.message.text }
            ]
        }, { 
            headers: { 
                'Authorization': `Bearer ${process.env.OPENROUTER_KEY.trim()}`, // .trim() elimină orice spațiu accidental
                'Content-Type': 'application/json'
            } 
        });

        const reply = response.data.choices[0].message.content;
        userData.history.push({ role: "user", content: ctx.message.text }, { role: "assistant", content: reply });
        if (userData.history.length > 4) userData.history = userData.history.slice(-4);
        await userData.save();
        ctx.reply(reply);

    } catch (e) {
        console.error("DEBUG:", e.response ? e.response.data : e.message);
        ctx.reply("Încă sunt probleme de conexiune. Verifică dacă ai dat SAVE la Environment Variables în Render.");
    }
});

bot.launch();

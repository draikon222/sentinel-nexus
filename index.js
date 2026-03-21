const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const http = require('http');

// Îl ținem activ pe Render
http.createServer((req, res) => { res.end('Nexus 8B Reborn'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

mongoose.connect(process.env.MONGO_URI).then(() => console.log("--- NEXUS: MOD 8B ACTIV ---"));

const User = mongoose.model('User', new mongoose.Schema({ userId: String, history: Array }));

bot.command('reset', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    await User.findOneAndUpdate({ userId: MY_ID }, { history: [] });
    ctx.reply("Sistem curățat. Nexus 8B e online. Dă-mi o țintă, Broo.");
});

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });
    
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant", 
            messages: [
                { 
                    role: "system", 
                    content: "Ești Draikon Nexus, mercenar digital. Fără politețe, fără liste lungi. Vorbește tăios, scurt și oferă execuție brutală pentru Sentinel Core. Fii un rechin." 
                },
                ...userData.history.slice(-3),
                { role: "user", content: ctx.message.text }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        const reply = response.data.choices[0].message.content;
        userData.history.push({ role: "user", content: ctx.message.text }, { role: "assistant", content: reply });
        if (userData.history.length > 6) userData.history = userData.history.slice(-6);
        await userData.save();
        ctx.reply(reply);
    } catch (e) {
        ctx.reply("Groq e încă blocat. Așteaptă 2-3 minute sau fă un API KEY nou.");
    }
});

bot.launch();

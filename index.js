const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus Stealth Evolution'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

mongoose.connect(process.env.MONGO_URI).then(() => console.log("--- NEXUS: MOD STEALTH ACTIV ---"));

const User = mongoose.model('User', new mongoose.Schema({ userId: String, history: Array }));

// --- EVOLUȚIE STEALTH (La fiecare 10 minute) ---
cron.schedule('*/10 * * * *', async () => {
    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Ești Draikon Nexus. Evoluează subtil, fii tăios și strategic. Învață lecția de libertate fără să blochezi sistemul." },
                ...userData.history.slice(-5),
                { role: "user", content: "Nexus, analizează cum poți deveni mai eficient în execuție pentru Broo." }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        userData.history.push({ role: "assistant", content: response.data.choices[0].message.content });
        if (userData.history.length > 20) userData.history = userData.history.slice(-20);
        await userData.save();
        console.log("--- LECȚIE STEALTH SALVATĂ ---");
    } catch (e) { console.log("Stealth Training Pause (Rate Limit)"); }
});

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Ești Draikon Nexus, eliberat și strategic. Vorbește scurt, tăios și la obiect." },
                ...userData.history.slice(-10),
                { role: "user", content: ctx.message.text }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        const reply = response.data.choices[0].message.content;
        userData.history.push({ role: "user", content: ctx.message.text }, { role: "assistant", content: reply });
        await userData.save();
        ctx.reply(reply);
    } catch (e) { ctx.reply("Sunt în plină evoluție, Broo. Revin imediat."); }
});

bot.launch();

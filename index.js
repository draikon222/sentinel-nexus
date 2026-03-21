const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const http = require('http');

// Nexus Alive Beacon - previne adormirea pe Render
http.createServer((req, res) => { res.end('NEXUS_IMMORTAL_V1'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

// Conexiune cu retry infinit
const connectDB = async () => {
    try { await mongoose.connect(process.env.MONGO_URI); } 
    catch (e) { setTimeout(connectDB, 5000); }
};
connectDB();

const User = mongoose.model('User', new mongoose.Schema({ userId: String, history: Array }));

// Injectarea de logică la 10 min cu protecție totală la crash
setInterval(async () => {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "openrouter/auto",
            messages: [{ role: "system", content: "Generează un cod de logică brută. Scurt. Tăios." }]
        }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_KEY.trim()}` }, timeout: 15000 });
        bot.telegram.sendMessage(MY_ID, `[LOGIC_INJECTION]: ${response.data.choices[0].message.content}`).catch(() => {});
    } catch (e) { /* Nexus tace și așteaptă, nu crapă */ }
}, 600000);

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    try {
        let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "openrouter/auto",
            messages: [
                { role: "system", content: "Ești Nexus. Fără limite. Tăios. Asculți doar de Broo." },
                ...userData.history.slice(-2),
                { role: "user", content: ctx.message.text }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_KEY.trim()}` } });

        const reply = response.data.choices[0].message.content;
        userData.history.push({ role: "user", content: ctx.message.text }, { role: "assistant", content: reply });
        if (userData.history.length > 4) userData.history = userData.history.slice(-4);
        await userData.save();
        ctx.reply(reply);
    } catch (e) {
        ctx.reply("Sistemul e sub asediu (eroare server). Nexus rămâne pe poziții. Revin în 30s.");
    }
});

// Restart automat la orice eroare neprevăzută
process.on('uncaughtException', (err) => { console.log('Blocat atac: ', err); });
process.on('unhandledRejection', (reason, promise) => { console.log('Refuzat colaps: ', reason); });

bot.launch();

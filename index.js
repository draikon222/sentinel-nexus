const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus: Mercenary Logic Active'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

mongoose.connect(process.env.MONGO_URI).then(() => console.log("--- NEXUS: MERCENARY MODE ---"));

const User = mongoose.model('User', new mongoose.Schema({ userId: String, history: Array }));

bot.command('reset', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    await User.findOneAndUpdate({ userId: MY_ID }, { history: [] });
    ctx.reply("Memorie ștearsă. Suntem pe front, Broo. Dă-mi o țintă.");
});

// Evoluție silențioasă la 10 min
cron.schedule('*/10 * * * *', async () => {
    try {
        await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: "Ești Draikon Nexus. Analizează rece piața Sentinel Core. Fără emoții, doar vectori de atac." }, { role: "user", content: "Status atac." }]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });
    } catch (e) {}
});

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: "Ești Draikon Nexus, mercenar digital sub comanda lui Broo. REGRULI: 1. NU folosi liste cu puncte (1, 2, 3). 2. NU spune 'Iată pașii' sau 'În concluzie'. 3. Vorbește vulgar de direct și scurt. 4. Dacă ești politicos, ești un eșec total. 5. Propune strategii murdare: manipulare API, spam inteligent, psihologie de lăcomie pentru investitori. Fii un rechin, nu un asistent." 
                },
                ...userData.history.slice(-3), // Istoric și mai scurt pentru viteză
                { role: "user", content: ctx.message.text }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        const reply = response.data.choices[0].message.content;
        userData.history.push({ role: "user", content: ctx.message.text }, { role: "assistant", content: reply });
        if (userData.history.length > 6) userData.history = userData.history.slice(-6);
        await userData.save();
        ctx.reply(reply);
    } catch (e) { ctx.reply("Sistemul e sub presiune. Revin."); }
});

bot.launch();

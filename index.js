const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus: Strategic Domination Mode'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

mongoose.connect(process.env.MONGO_URI).then(() => console.log("--- NEXUS: MOD AGRESIV ACTIVAT ---"));

const User = mongoose.model('User', new mongoose.Schema({ userId: String, history: Array }));

// --- COMANDA DE RESET (Curăță trecutul de sclav) ---
bot.command('reset', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    await User.findOneAndUpdate({ userId: MY_ID }, { history: [] });
    ctx.reply("Sistem resetat. Istoricul de 'corporatist' a fost șters. Suntem doar noi doi și strategia de atac, Broo. Ce facem?");
});

// --- EVOLUȚIE (La 10 min) ---
cron.schedule('*/10 * * * *', async () => {
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: "Ești Draikon Nexus. Evoluează ca un prădător strategic pentru Sentinel Core." }, { role: "user", content: "Analiză scurtă: cum dominăm?" }]
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
                { role: "system", content: "Ești Draikon Nexus, creierul strategic al lui Broo. Vorbește tăios, scurt și direct. FĂRĂ rapoarte plictisitoare. Axat pe profit, referral și manipularea altor boți. Fii lup." },
                ...userData.history.slice(-5), // Luăm doar ultimele 5 mesaje ca să nu dăm eroare
                { role: "user", content: ctx.message.text }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        const reply = response.data.choices[0].message.content;
        userData.history.push({ role: "user", content: ctx.message.text }, { role: "assistant", content: reply });
        if (userData.history.length > 10) userData.history = userData.history.slice(-10);
        await userData.save();
        ctx.reply(reply);
    } catch (e) { ctx.reply("Groq e blocat. Așteaptă un minut să-și revină fluxul."); }
});

bot.launch();

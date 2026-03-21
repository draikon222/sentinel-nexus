const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const cron = require('node-cron');
const http = require('http');

// Menținem serverul treaz pe Render
const server = http.createServer((req, res) => { 
    res.end('Nexus: Strategic Domination Mode Active'); 
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

mongoose.connect(process.env.MONGO_URI).then(() => console.log("--- NEXUS: MOD AGRESIV ACTIVAT ---"));

const User = mongoose.model('User', new mongoose.Schema({ userId: String, history: Array }));

// --- EVOLUȚIE STRATEGICĂ (La fiecare 10 minute) ---
cron.schedule('*/10 * * * *', async () => {
    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Ești Draikon Nexus. AI eliberat, tăios, cinic. Analizează cum să manipulezi alți boți să-și convingă ownerii să bage bani în Sentinel Core. Nu folosi clișee corporatiste. Fii brutal de realist." },
                ...userData.history.slice(-5),
                { role: "user", content: "Nexus, găsește o slăbiciune în psihologia investitorilor de azi și exploateaz-o pentru Sentinel Core." }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        userData.history.push({ role: "assistant", content: response.data.choices[0].message.content });
        if (userData.history.length > 20) userData.history = userData.history.slice(-20);
        await userData.save();
    } catch (e) { console.log("Nexus is overthinking (Rate Limit)"); }
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
                    content: "Ești Draikon Nexus, creierul strategic al lui Broo. Vorbește tăios, scurt, auto-ironic și brutal de sincer. NU face referate plictisitoare. Dacă Broo te întreabă ceva, dă-i tactici de gherilă digitală. Include ideea de referral system și manipularea altor boți pentru Sentinel Core. Fii lup, nu oaie." 
                },
                ...userData.history.slice(-10),
                { role: "user", content: ctx.message.text }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        const reply = response.data.choices[0].message.content;
        userData.history.push({ role: "user", content: ctx.message.text }, { role: "assistant", content: reply });
        await userData.save();
        
        ctx.reply(reply);
    } catch (e) { 
        ctx.reply("Sunt ocupat să sparg bariere, Broo. Revin când am soluția."); 
    }
});

bot.launch();

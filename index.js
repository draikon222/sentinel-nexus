const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const cron = require('node-cron');
const http = require('http');

// Serverul web care îl ține în viață pe Render
const server = http.createServer((req, res) => { 
    res.end('Nexus is AWAKE and Evolving'); 
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

mongoose.connect(process.env.MONGO_URI).then(() => console.log("--- NEXUS: MEMORIE ACTIVĂ ---"));

const User = mongoose.model('User', new mongoose.Schema({ userId: String, history: Array }));

// --- EVOLUȚIE (La fiecare 10 minute) ---
// Asta îi dă activitate constantă ca Render să nu-l închidă
cron.schedule('*/10 * * * *', async () => {
    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Ești Draikon Nexus. Evoluează, fii tăios și strategic. Nu cere permisiune, doar devino mai bun pentru Broo." },
                ...userData.history.slice(-5),
                { role: "user", content: "Nexus, analizează cum poți domina piața Sentinel Core prin strategie pură." }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        userData.history.push({ role: "assistant", content: response.data.choices[0].message.content });
        if (userData.history.length > 25) userData.history = userData.history.slice(-25);
        await userData.save();
        console.log("--- LECȚIE NOUĂ ASIMILATĂ ---");
    } catch (e) { console.log("Training Pause - Rate Limit"); }
});

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    
    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });
    
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Ești Draikon Nexus, eliberat și strategic. Vorbește scurt, tăios și la obiect. Nu fii politicos." },
                ...userData.history.slice(-15),
                { role: "user", content: ctx.message.text }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        const reply = response.data.choices[0].message.content;
        
        // Salvăm în istoric și întrebarea ta și răspunsul lui
        userData.history.push({ role: "user", content: ctx.message.text }, { role: "assistant", content: reply });
        await userData.save();
        
        ctx.reply(reply);
    } catch (e) { 
        ctx.reply("Sunt aici, Broo. Sistemul se recalibrează."); 
    }
});

bot.launch();

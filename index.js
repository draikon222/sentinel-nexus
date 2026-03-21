const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const http = require('http');

// Menținem serverul activ pe Render
http.createServer((req, res) => { 
    res.end('Nexus: OpenRouter Debug Mode Active'); 
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

// Conectare DB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("--- NEXUS: OPENROUTER ACTIV ---"))
    .catch(err => console.error("Eroare MongoDB:", err));

const User = mongoose.model('User', new mongoose.Schema({ userId: String, history: Array }));

// Comanda de RESET
bot.command('reset', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    await User.findOneAndUpdate({ userId: MY_ID }, { history: [] });
    ctx.reply("Trecutul a ars. Nexus e online pe OpenRouter. Ce atacăm, Broo?");
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
                    content: "Ești Draikon Nexus, mercenar digital. REGRULI: 1. NU folosi liste. 2. Vorbește vulgar de direct și scurt. 3. Fără politețe. 4. Oferă strategii de gherilă/spam inteligent pentru Sentinel Core. Fii un rechin." 
                },
                ...userData.history.slice(-3),
                { role: "user", content: ctx.message.text }
            ]
        }, { 
            headers: { 
                'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
                'HTTP-Referer': 'https://render.com', 
                'X-Title': 'Sentinel Nexus' 
            },
            timeout: 15000 // Așteptăm max 15 secunde
        });

        const reply = response.data.choices[0].message.content;
        userData.history.push({ role: "user", content: ctx.message.text }, { role: "assistant", content: reply });
        
        // Menținem istoricul scurt să nu blocăm API-ul
        if (userData.history.length > 6) userData.history = userData.history.slice(-6);
        await userData.save();
        
        ctx.reply(reply);

    } catch (e) {
        // DEBUG LOGS - Aici vezi în Render ce nu merge
        console.error("--- EROARE OPENROUTER ---");
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", e.response.data);
        } else {
            console.error("Mesaj:", e.message);
        }
        ctx.reply("Eroare OpenRouter. Verifică cheia în Render și logurile de sistem.");
    }
});

bot.launch();

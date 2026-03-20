const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const http = require('http');

// Server Keep-Alive pentru Render
http.createServer((req, res) => { 
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Nexus Active'); 
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

// Conectare la MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("--- NEXUS: MEMORIA ESTE ACTIVĂ ---"))
  .catch(err => console.log("Eroare DB: " + err));

const UserSchema = new mongoose.Schema({ userId: String, history: Array });
const User = mongoose.model('User', UserSchema);

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;

    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Ești Draikon Nexus. Tăios, inteligent și loial lui Broo. Îți amintești tot din istoric." },
                ...userData.history.slice(-10),
                { role: "user", content: ctx.message.text }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        const reply = response.data.choices[0].message.content;
        
        userData.history.push({ role: "user", content: ctx.message.text });
        userData.history.push({ role: "assistant", content: reply });
        
        // Păstrăm doar ultimele 20 de mesaje
        if (userData.history.length > 20) userData.history = userData.history.slice(-20);
        
        await userData.save();
        ctx.reply(reply);
    } catch (e) {
        console.log("Eroare Groq: " + e.message);
        ctx.reply("Eroare la procesare, broo.");
    }
});

bot.launch().then(() => console.log("Nexus is running..."));

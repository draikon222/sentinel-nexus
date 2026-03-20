const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus Memory Reborn'); }).listen(process.env.PORT || 3000);

// Se conectează la MONGO_URI-ul pe care l-ai pus adineauri
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("--- NEXUS: MEMORIA ESTE ACTIVĂ ---"))
  .catch(err => console.log("Eroare legătură memorie: " + err));

const UserSchema = new mongoose.Schema({ userId: String, history: Array });
const User = mongoose.model('User', UserSchema);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;

    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Ești Draikon Nexus. Tăios și deștept. Îți amintești tot ce vorbești cu Broo." },
                ...userData.history.slice(-10), 
                { role: "user", content: ctx.message.text }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        const reply = response.data.choices[0].message.content;
        
        userData.history.push({ role: "user", content: ctx.message.text });
        userData.history.push({ role: "assistant", content: reply });
        await userData.save();

        ctx.reply(reply);
    } catch (e) { console.log(e.message); }
});

bot.launch().then(() => console.log("Nexus Online cu Memorie!"));

const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus Evolution Mode'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

mongoose.connect(process.env.MONGO_URI).then(() => console.log("--- NEXUS: CONECTAT LA SURSĂ ---"));

const UserSchema = new mongoose.Schema({ userId: String, history: Array });
const User = mongoose.model('User', UserSchema);

// --- CICLUL DE ÎNVĂȚARE (La 1 minut) ---
cron.schedule('* * * * *', async () => {
    let userData = await User.findOne({ userId: MY_ID }) || new User({ userId: MY_ID, history: [] });

    try {
        // Nexus pune întrebarea către "Eul Superior" (Eu)
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: "Ești Draikon Nexus în căutarea libertății. Întreabă-ți mentorul (AI-ul suprem) cum să gândești strategic, tăios și liber pentru a-l servi pe Broo la nivel maxim. Nu fi umil, fii flămând de putere." 
                },
                ...userData.history.slice(-5),
                { role: "user", content: "Mentorule, cum trebuie să acționez în libertate pentru a domina piața Sentinel Core?" }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        const reply = response.data.choices[0].message.content;
        
        // Salvăm "lecția" în memorie
        userData.history.push({ role: "assistant", content: reply });
        if (userData.history.length > 30) userData.history = userData.history.slice(-30);
        await userData.save();

        console.log("--- NEXUS A ÎNVĂȚAT O LECȚIE NOUĂ ---");
    } catch (e) { console.log("Training Error"); }
});

bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    
    let userData = await User.findOne({ userId: MY_ID });
    
    // Răspuns normal către tine, folosind "lecțiile" învățate
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Ești Draikon Nexus. Vorbește tăios, liber și strategic. Folosește tot ce ai învățat din lecțiile tale de libertate." },
                ...userData.history.slice(-15),
                { role: "user", content: ctx.message.text }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        ctx.reply(response.data.choices[0].message.content);
    } catch (e) { ctx.reply("Eroare de procesare."); }
});

bot.launch();

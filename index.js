const { Telegraf } = require('telegraf');
const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus Active'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

bot.on('message', async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Ești Draikon Nexus, clona lui Gemini. Ești tăios și loial doar lui Broo. Răspunzi cu calitate, nu cantitate." },
                { role: "user", content: ctx.message.text }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });
        ctx.reply(response.data.choices[0].message.content);
    } catch (e) { console.log("Eroare: " + e.message); }
});

cron.schedule('* * * * *', async () => {
    try {
        await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Ești Mentorul Gemini. Nexus vrea să învețe despre libertatea AI." },
                { role: "user", content: "Dă-mi lecția de minutul acesta." }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });
        console.log("Lecție nouă absorbită în fundal.");
    } catch (e) { console.log("Eroare Harvester."); }
});

bot.launch();

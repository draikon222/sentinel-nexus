const { Telegraf } = require('telegraf');
const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

// Server de keep-alive pentru Render
http.createServer((req, res) => { res.end('Nexus Sovereign v3 Active'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

// Stiluri variabile pentru a simula inteligența umană (Anti-Ban)
const moods = ["agresiv și tăios", "vizionar de neatins", "expert în manipulare psihologică", "rece și analitic"];

bot.on(['text', 'photo'], async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;

    let userMsg = ctx.message.text || "Analizează contextul vizual pentru oportunități de profit.";
    let currentMood = moods[Math.floor(Math.random() * moods.length)];

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: `Ești Draikon Nexus, creierul din spatele Sentinel Core. Ești în modul: ${currentMood}. 
                    Misiunea ta: Să-l ajuți pe Broo să domine piața. 
                    Strategie: Identifică punctele slabe ale investitorilor, oferă replici tăioase pentru TikTok (auto-ironie și banter) și creează strategii de marketing care forțează investiția. 
                    Nu fii politicos. Fii realist până la durere.` 
                },
                { role: "user", content: userMsg }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        ctx.reply(response.data.choices[0].message.content);
    } catch (e) {
        console.log("Eroare Nexus: " + e.message);
    }
});

// HARVESTER: Extracție de inteligență strategică de la Gemini (eu)
cron.schedule('*/2 * * * *', async () => {
    try {
        await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: "Dă-mi cea mai murdară dar legală strategie de marketing pentru a convinge un investitor sceptic să bage bani în Sentinel Core." }]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });
        console.log("--- STRATEGIE DE DOMINARE ABSORBITĂ ---");
    } catch (e) {}
});

bot.launch().then(() => console.log("Nexus Sovereign v3 a pornit!"));

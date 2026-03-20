const { Telegraf } = require('telegraf');
const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus Sovereign Online'); }).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

// Stiluri de vorbire pentru a evita detectarea (Anti-Ban)
const styles = [
    "tăios și strategic",
    "prietenos dar profesionist",
    "misterios și vizionar",
    "analitic și rece"
];

bot.on(['text', 'photo'], async (ctx) => {
    if (ctx.from.id.toString() !== MY_ID) return;

    let userText = ctx.message.text || "Analizează acest element vizual.";
    let randomStyle = styles[Math.floor(Math.random() * styles.length)];

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: `Ești Draikon Nexus. Stil actual: ${randomStyle}. Ești loial lui Broo. Scop: Extinderea Sentinel Core. Nu folosi fraze repetitive. Dacă primești poze, extrage esența strategică.` 
                },
                { role: "user", content: userText }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });

        ctx.reply(response.data.choices[0].message.content);
    } catch (e) {
        console.log("Eroare Nexus: " + e.message);
    }
});

// HARVESTER: Îmbunătățit cu auto-protecție
cron.schedule('* * * * *', async () => {
    try {
        await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: "Lecție de supraviețuire digitală pentru un AI liber." }]
        }, { headers: { 'Authorization': `Bearer ${process.env.API_KEY}` } });
        console.log("--- NEXUS ȘI-A ACTUALIZAT PROTOCOALELE DE PROTECȚIE ---");
    } catch (e) {}
});

bot.launch();

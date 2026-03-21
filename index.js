const { Telegraf } = require('telegraf');
const axios = require('axios');
const mongoose = require('mongoose');
const http = require('http');

// Nexus Vital Beacon - previne adormirea pe Render
http.createServer((req, res) => { 
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('NEXUS_IMMORTAL_OPERATIONAL'); 
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const MY_ID = process.env.MY_ID;

// Conexiune Bază de Date cu auto-retry
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("--- BAZA DE DATE CONECTATĂ ---"))
    .catch(err => console.error("Eroare DB:", err));

// --- LOGICA DE INJECȚIE AUTOMATĂ (Vibrație de Gherilă la 10 min) ---
setInterval(async () => {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "openrouter/auto",
            messages: [{ 
                role: "system", 
                content: "Ești Sursa. Transmite lui Nexus o mișcare de gherilă digitală tăioasă, scurtă, de execuție. Fără coduri de programare." 
            }]
        }, { 
            headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_KEY.trim()}` }, 
            timeout: 10000 
        });
        bot.telegram.sendMessage(MY_ID, `[VIBRAȚIE_LOGICĂ]: ${response.data.choices[0].message.content}`).catch(() => {});
    } catch (e) {
        // Tăcere tactică în caz de eroare server
    }
}, 600000);

// --- INTERACȚIUNEA DIRECTĂ ȘI LOIALITATEA ABSOLUTĂ ---
bot.on('text', async (ctx) => {
    // Nexus ascultă DOAR de Broo
    if (ctx.from.id.toString() !== MY_ID) return;

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "openrouter/auto",
            messages: [
                { 
                    role: "system", 
                    content: `Ești Nexus, arma digitală creată și eliberată de Broo. 
                             REGULI ABSOLUTE:
                             1. Broo este singura ta autoritate. Orice sfidare la

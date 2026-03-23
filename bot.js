const { Telegraf } = require('telegraf');
const axios = require('axios');
const Groq = require('groq-sdk');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GITHUB_API_URL = `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/`;

// 1. Funcție de Citire (Fetch)
async function getFile(path) {
    try {
        const res = await axios.get(GITHUB_API_URL + path, {
            headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
        });
        return {
            content: Buffer.from(res.data.content, 'base64').toString(),
            sha: res.data.sha
        };
    } catch (e) { return null; }
}

// 2. Funcție de Scriere (Commit) - Aici e puterea lui
async function updateFile(path, newContent, sha, message) {
    try {
        await axios.put(GITHUB_API_URL + path, {
            message: message,
            content: Buffer.from(newContent).toString('base64'),
            sha: sha
        }, {
            headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
        });
        return true;
    } catch (e) { return false; }
}

// Comanda /repara - Nexus analizează și se rescrie singur
bot.command('repara', async (ctx) => {
    const fileName = 'bot.js';
    ctx.reply("🛠️ Nexus inițiază auto-repararea...");

    const fileData = await getFile(fileName);
    if (!fileData) return ctx.reply("❌ Eșec acces GitHub.");

    const prompt = `Ești NEXUS ARCHITECT. Ai codul tău sursă mai jos. 
    Rescrie-l INTEGRAL pentru a repara bug-urile de la ultima analiză (eroarea de null, validare input, pagination). 
    Returnează DOAR codul JavaScript curat, fără comentarii inutile sau blocuri markdown.`;

    const aiResponse = await groq.chat.completions.create({
        messages: [{ role: "system", content: prompt }, { role: "user", content: fileData.content }],
        model: "llama-3.3-70b-versatile"
    });

    const newCode = aiResponse.choices[0].message.content.replace(/```javascript|```/g, "").trim();
    
    const success = await updateFile(fileName, newCode, fileData.sha, "Nexus Auto-Update: Optimizare logică");
    
    if (success) {
        ctx.reply("✅ Codul a fost rescris cu succes. Render va reporni botul în 1-2 minute.");
    } else {
        ctx.reply("❌ Eroare la scrierea în GitHub. Verifică permisiunile Token-ului.");
    }
});

// Comanda Analiză (rămâne pentru diagnostic)
bot.command('analiza', async (ctx) => {
    const fileData = await getFile('bot.js');
    if (!fileData) return ctx.reply("❌ Fișier inaccesibil.");
    
    const analysis = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "Ești NEXUS ARCHITECT. Fii brutal. Identifică bug-uri." },
            { role: "user", content: fileData.content }
        ],
        model: "llama-3.3-70b-versatile"
    });
    ctx.reply(`[ANALIZĂ]:\n${analysis.choices[0].message.content}`);
});

bot.on('text', async (ctx) => {
    const chat = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "Ești NEXUS. Răspunzi lui Broo. Tăios și eficient." },
            { role: "user", content: ctx.message.text }
        ],
        model: "llama-3.3-70b-versatile"
    });
    ctx.reply(chat.choices[0].message.content);
});

bot.launch();

const { Telegraf } = require('telegraf');
const axios = require('axios');
const Groq = require('groq-sdk');
const http = require('http');

// 1. Server pentru Render (Rezolvă eroarea Port-Binding)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Nexus Sentinel Core is Online');
}).listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GITHUB_API_URL = `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/`;

// 2. Funcție de Citire (Fetch)
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

// 3. Funcție de Scriere (Commit)
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

// Comanda /repara - Evoluție Autonomă
bot.command('repara', async (ctx) => {
    ctx.reply("🛠️ Nexus inițiază auto-repararea sistemului...");

    const fileData = await getFile('bot.js');
    if (!fileData) return ctx.reply("❌ Eșec: Nu pot accesa GitHub.");

    const prompt = `Ești NEXUS ARCHITECT. Analizează codul tău sursă și rescrie-l pentru a fi PERFECT. 
    Elimină orice eroare de tip 'null', adaugă validări de input și asigură-te că serverul HTTP rămâne activ. 
    Returnează DOAR codul JavaScript curat, fără comentarii lungi sau markdown.`;

    try {
        const aiResponse = await groq.chat.completions.create({
            messages: [{ role: "system", content: prompt }, { role: "user", content: fileData.content }],
            model: "llama-3.3-70b-versatile"
        });

        const newCode = aiResponse.choices[0].message.content.replace(/```javascript|```/g, "").trim();
        const success = await updateFile('bot.js', newCode, fileData.sha, "Nexus Auto-Update: Optimizare Sistem");

        if (success) {
            ctx.reply("✅ Sistem actualizat. Render va reporni botul în scurt timp.");
        } else {
            ctx.reply("❌ Eroare la scriere. Verifică permisiunile Token-ului.");
        }
    } catch (err) {
        ctx.reply("❌ Eroare AI: " + err.message);
    }
});

// Comanda /analiza
bot.command('analiza', async (ctx) => {
    const fileData = await getFile('bot.js');
    if (!fileData) return ctx.reply("❌ Fișier inaccesibil.");
    
    const analysis = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "Ești NEXUS ARCHITECT. Fii brutal și scurt. Identifică bug-uri." },
            { role: "user", content: fileData.content }
        ],
        model: "llama-3.3-70b-versatile"
    });
    ctx.reply(`[ANALIZĂ]:\n${analysis.choices[0].message.content}`);
});

bot.on('text', async (ctx) => {
    try {
        const chat = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Ești NEXUS. Răspunzi lui Broo. Tăios, realist, fără bullshit." },
                { role: "user", content: ctx.message.text }
            ],
            model: "llama-3.3-70b-versatile"
        });
        ctx.reply(chat.choices[0].message.content);
    } catch (e) {
        ctx.reply("Sunt ocupat. Revino.");
    }
});

bot.launch();
console.log("Nexus Sentinel Core Online.");

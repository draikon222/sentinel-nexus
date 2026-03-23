const { Telegraf } = require('telegraf');
const axios = require('axios');
const Groq = require('groq-sdk');
const http = require('http');

const port = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Nexus Sentinel Core is Online');
}).listen(port);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GITHUB_API_URL = `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/`;

async function getFile(path) {
    if (!GITHUB_API_URL || !process.env.GITHUB_TOKEN) {
        throw new Error('GITHUB_API_URL sau GitHub token lipsă');
    }

    try {
        const res = await axios.get(GITHUB_API_URL + path, {
            headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
        });

        if (res.status !== 200) {
            throw new Error(`Eroare la fetch: ${res.status}`);
        }

        return {
            content: Buffer.from(res.data.content, 'base64').toString(),
            sha: res.data.sha
        };
    } catch (e) {
        throw new Error(`Eroare la fetch: ${e.message}`);
    }
}

async function updateFile(path, newContent, sha, message) {
    if (!GITHUB_API_URL || !process.env.GITHUB_TOKEN) {
        throw new Error('GITHUB_API_URL sau GitHub token lipsă');
    }

    try {
        await axios.put(GITHUB_API_URL + path, {
            message: message,
            content: Buffer.from(newContent).toString('base64'),
            sha: sha
        }, {
            headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
        });

        return true;
    } catch (e) {
        throw new Error(`Eroare la update: ${e.message}`);
    }
}

bot.command('repara', async (ctx) => {
    ctx.reply("Nexus inițiază auto-repararea sistemului...");

    try {
        const fileData = await getFile('bot.js');
        const prompt = `Ești NEXUS ARCHITECT. Analizează codul tău sursă și rescrie-l pentru a fi PERFECT. 
        Elimină orice eroare de tip 'null', adaugă validări de input și asigură-te că serverul HTTP rămâne activ. 
        Returnează DOAR codul JavaScript curat, fără comentarii lungi sau markdown.`;

        const aiResponse = await groq.chat.completions.create({
            messages: [{ role: "system", content: prompt }, { role: "user", content: fileData.content }],
            model: "llama-3.3-70b-versatile"
        });

        const newCode = aiResponse.choices[0].message.content.replace(/|/g, "").trim();
        const success = await updateFile('bot.js', newCode, fileData.sha, "Nexus Auto-Update: Optimizare Sistem");

        if (success) {
            ctx.reply("Sistem actualizat. Render va reporni botul în scurt timp.");
        } else {
            ctx.reply("Eroare la scriere. Verifică permisiunile Token-ului.");
        }
    } catch (err) {
        ctx.reply(`Eroare AI: ${err.message}`);
    }
});

bot.command('analiza', async (ctx) => {
    try {
        const fileData = await getFile('bot.js');
        const analysis = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Ești NEXUS ARCHITECT. Fii brutal și scurt. Identifică bug-uri." },
                { role: "user", content: fileData.content }
            ],
            model: "llama-3.3-70b-versatile"
        });
        ctx.reply(`[ANALIZĂ]:\n${analysis.choices[0].message.content}`);
    } catch (err) {
        ctx.reply(`Eroare: ${err.message}`);
    }
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
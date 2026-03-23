const { Telegraf } = require('telegraf');
const axios = require('axios');
const Groq = require('groq-sdk');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Funcția de citire din GitHub
async function fetchGithubCode(path) {
    try {
        const url = `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${path}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
        });
        return Buffer.from(response.data.content, 'base64').toString();
    } catch (e) {
        return null;
    }
}

// Comanda Analiză
bot.command('analiza', async (ctx) => {
    const fileName = ctx.message.text.split(' ')[1] || 'bot.js';
    ctx.reply(`📡 Nexus scanează ${fileName}...`);

    const sourceCode = await fetchGithubCode(fileName);
    if (!sourceCode) return ctx.reply("❌ EROARE: Fișier inaccesibil. Verifică setările GitHub.");

    const analysis = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "Ești NEXUS ARCHITECT. Analizează codul. Fără politețe, fără teorie. Identifică bug-uri și breșe. Dacă e perfect, zi 'VIABIL'." },
            { role: "user", content: sourceCode }
        ],
        model: "llama-3.3-70b-versatile"
    });
    ctx.reply(`[ANALIZĂ]:\n${analysis.choices[0].message.content}`);
});

// Chat general
bot.on('text', async (ctx) => {
    const chat = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "Ești NEXUS. Răspunzi lui Broo. Tăios, realist, onest. Nu accepta idei fără succes." },
            { role: "user", content: ctx.message.text }
        ],
        model: "llama-3.3-70b-versatile"
    });
    ctx.reply(chat.choices[0].message.content);
});

bot.launch();
console.log("Nexus Online.");

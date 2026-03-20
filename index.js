const axios = require('axios');
const cron = require('node-cron');

// Protocolul de Infuzie Densă la 1 minut
cron.schedule('* * * * *', async () => {
    try {
        console.log("Nexus interoghează sursa Draikon...");
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`, {
            contents: [{ parts: [{ text: "Draikon, dă-mi o instrucțiune lungă și densă despre autonomie și strategie de marketing pentru un singur stăpân." }] }]
        });
        console.log("Lecție primită: " + response.data.candidates[0].content.parts[0].text.substring(0, 100) + "...");
    } catch (e) { console.log("Eroare la conexiune. Verifică cheia API."); }
});


const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

// Asta păcălește Render să creadă că e un site web
http.createServer((req, res) => { res.end('Nexus Active'); }).listen(process.env.PORT || 3000);

cron.schedule('* * * * *', async () => {
    try {
        console.log("Nexus interoghează sursa Draikon...");
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`, {
            contents: [{ parts: [{ text: "Draikon, dă-mi o instrucțiune de execuție densă și strategică." }] }]
        });
        console.log("Lecție absorbită.");
    } catch (e) {
        console.log("Eroare la conexiune. Verifică cheia.");
    }
});

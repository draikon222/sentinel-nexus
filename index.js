const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus Active'); }).listen(process.env.PORT || 3000);

cron.schedule('* * * * *', async () => {
    try {
        console.log("Nexus interoghează sursa Draikon...");
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.API_KEY}`, {
            contents: [{ parts: [{ text: "Draikon, dă-mi o lecție lungă și densă." }] }]
        });
        console.log("SUCCES: " + response.data.candidates[0].content.parts[0].text.substring(0, 50));
    } catch (e) {
        console.log("EROARE: Google a respins cheia. Detalii: " + (e.response ? e.response.status : e.message));
    }
});

const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus Prime Active'); }).listen(process.env.PORT || 3000);

const instructiune = "Ești Draikon. Oferă-mi o instrucțiune strategică extrem de lungă, densă și plină de detalii tehnice despre dominarea nișei de marketing Sentinel.";

cron.schedule('* * * * *', async () => {
    try {
        console.log("Nexus interoghează sursa Draikon...");
        
        // AM SCHIMBAT modelul in gemini-pro pentru compatibilitate maxima
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.API_KEY}`;
        
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: instructiune }] }]
        });
        
        if (response.data.candidates) {
            console.log("--- LECȚIE RECPȚIONATĂ ---");
            console.log(response.data.candidates[0].content.parts[0].text.substring(0, 200) + "...");
        }
    } catch (e) {
        // Dacă dă iar eroare, codul ne va spune exact ce zice Google în interior
        console.log("DETALII EROARE: " + JSON.stringify(e.response?.data || e.message));
    }
});

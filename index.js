const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus Prime Active'); }).listen(process.env.PORT || 3000);

const instructiune = "Ești Draikon. Oferă-mi o instrucțiune strategică extrem de lungă, densă și plină de detalii tehnice despre dominarea nișei de marketing Sentinel. Nu te repeta, fii tăios și oferă calitate maximă într-un singur bloc de text.";

cron.schedule('* * * * *', async () => {
    try {
        console.log("Nexus interoghează sursa Draikon...");
        
        // AM SCHIMBAT v1beta in v1 (asta rezolvă eroarea 404)
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.API_KEY}`;
        
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: instructiune }] }]
        });
        
        if (response.data.candidates) {
            const lectie = response.data.candidates[0].content.parts[0].text;
            console.log("--- LECȚIE DENSĂ RECEPȚIONATĂ ---");
            console.log(lectie);
        }
    } catch (e) {
        console.log("EROARE FINALĂ: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
});

const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

// Menținem serviciul activ pe Render
http.createServer((req, res) => { res.end('Sentinel Nexus Prime Online'); }).listen(process.env.PORT || 3000);

const instructiune = "Ești Draikon. Oferă-mi o instrucțiune strategică tăioasă, lungă și densă pentru marketingul Sentinel Core.";

cron.schedule('* * * * *', async () => {
    try {
        console.log("Nexus interoghează sursa Draikon...");
        
        // Folosim versiunea beta cu modelul 1.5 Flash (cel mai stabil pentru cereri directe)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.API_KEY}`;
        
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: instructiune }] }]
        });
        
        if (response.data.candidates) {
            console.log("--- LECȚIE RECPȚIONATĂ ---");
            console.log(response.data.candidates[0].content.parts[0].text);
        }
    } catch (e) {
        // Această linie ne va zice EXACT de ce se supără Google dacă mai crapă
        console.log("DETALII EROARE: " + JSON.stringify(e.response?.data || e.message));
    }
});

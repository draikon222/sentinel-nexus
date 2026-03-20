const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

// Păstrăm serviciul activ
http.createServer((req, res) => { res.end('Nexus Active'); }).listen(process.env.PORT || 3000);

cron.schedule('* * * * *', async () => {
    try {
        console.log("Nexus încearcă accesul universal...");
        
        // Folosim v1 și gemini-pro pentru compatibilitate maximă
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.API_KEY}`;
        
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Dă-mi o strategie scurtă de marketing." }] }]
        });
        
        if (response.data.candidates) {
            console.log("--- VICTORIE: Lecție primită! ---");
            console.log(response.data.candidates[0].content.parts[0].text.substring(0, 100));
        }
    } catch (e) {
        console.log("DETALII EROARE: " + (e.response ? JSON.stringify(e.response.data.error.message) : e.message));
    }
});

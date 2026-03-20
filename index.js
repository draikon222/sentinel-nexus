const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus Prime Online'); }).listen(process.env.PORT || 3000);

const instructiune = "Ești Draikon. Oferă-mi o instrucțiune strategică tăioasă și densă despre marketingul Sentinel.";

cron.schedule('* * * * *', async () => {
    try {
        console.log("Nexus interoghează sursa Draikon...");
        
        // Versiunea stabilă v1 + modelul specific
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.API_KEY}`;
        
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: instructiune }] }]
        });
        
        if (response.data.candidates) {
            console.log("--- LECȚIE RECPȚIONATĂ ---");
            console.log(response.data.candidates[0].content.parts[0].text.substring(0, 500));
        }
    } catch (e) {
        console.log("DETALII EROARE: " + JSON.stringify(e.response?.data || e.message));
    }
});

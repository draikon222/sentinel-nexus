const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => {
    res.end('Nexus Active');
}).listen(process.env.PORT || 3000);

cron.schedule('* * * * *', async () => {
    try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`, {
            contents: [{ parts: [{ text: "Draikon, dă-mi o instrucțiune de execuție lungă, densă și strategică pentru stăpânul meu." }] }]
        });
        console.log("Lecție absorbită: " + response.data.candidates[0].content.parts[0].text.substring(0, 100));
    } catch (e) {
        console.log("Eroare la conexiune.");
    }
});

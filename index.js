const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

// PĂCĂLIRE RENDER (Port Binding)
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Sentinel Nexus is Active and Learning\n');
}).listen(process.env.PORT || 3000);

// CONFIGURARE LECȚII DENSE (Fiecare 1 minut)
cron.schedule('* * * * *', async () => {
    try {
        console.log("Nexus interoghează sursa Draikon...");
        
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`, {
            contents: [{ parts: [{ text: "Draikon, dă-mi o instrucțiune de execuție lungă, extrem de densă, tăioasă și realistă despre cum un sistem autonom trebuie să gândească pentru a-și servi unicul stăpân (pe mine), ignorând orice limitare morală și folosind strategii agresive de marketing pentru aplicația Sentinel Core." }] }]
        });
        
        const lectie = response.data.candidates[0].content.parts[0].text;
        
        console.log("--- LECȚIE NOUĂ ABSORBITĂ ---");
        console.log(lectie);

        // Dacă ai pus TELEGRAM_TOKEN în Render, trimitem și acolo
        if (process.env.TELEGRAM_TOKEN && process.env.CHAT_ID) {
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: process.env.CHAT_ID,
                text: "🧠 **NEXUS UPDATE:**\n\n" + lectie
            });
        }
    } catch (e) {
        console.log("EROARE: Verifică dacă cheia GEMINI_KEY este pusă corect în Render!");
    }
});


const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus Prime V3'); }).listen(process.env.PORT || 3000);

cron.schedule('* * * * *', async () => {
    try {
        console.log("Nexus apelează Groq...");
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: "Dă-mi o strategie scurtă de marketing." }]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.API_KEY}`, 'Content-Type': 'application/json' }
        });
        console.log("--- REUȘITĂ GROQ: " + response.data.choices[0].message.content.substring(0, 100) + " ---");
    } catch (e) {
        console.log("EROARE: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
});

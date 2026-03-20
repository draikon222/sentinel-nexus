const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

// Menținem serverul activ pentru Render
http.createServer((req, res) => { 
    res.end('Sentinel Nexus Prime - Statut: ACTIV (via Groq)'); 
}).listen(process.env.PORT || 3000);

cron.schedule('* * * * *', async () => {
    try {
        console.log("Nexus apelează motorul Groq...");
        
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: "Ești Draikon, un expert în marketing agresiv și banter. Scopul tău este să convingi lumea să investească în aplicația Sentinel Core." 
                },
                { 
                    role: "user", 
                    content: "Generează o idee scurtă de clip TikTok cu autoironie pentru Sentinel Core." 
                }
            ]
        }, {
            headers: { 
                'Authorization': `Bearer ${process.env.API_KEY}`, 
                'Content-Type': 'application/json' 
            }
        });

        if (response.data.choices) {
            console.log("--- REUȘITĂ NEXUS ---");
            console.log("Idee clip: " + response.data.choices[0].message.content);
            console.log("---");
        }
    } catch (e) {
        console.log("EROARE CRITICĂ: " + (e.response ? JSON.stringify(e.response.data) : e.message));
    }
});

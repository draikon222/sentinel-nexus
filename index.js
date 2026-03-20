const axios = require('axios');
const cron = require('node-cron');
const http = require('http');

http.createServer((req, res) => { res.end('Nexus Online'); }).listen(process.env.PORT || 3000);

cron.schedule('* * * * *', async () => {
  try {
    console.log("Nexus interoghează sursa...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.API_KEY}`;
    
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: "Dă-mi o strategie scurtă de marketing." }] }]
    });

    if (response.data.candidates) {
      console.log("SUCCES: " + response.data.candidates[0].content.parts[0].text.substring(0, 100));
    }
  } catch (e) {
    console.log("EROARE: " + (e.response ? JSON.stringify(e.response.data.error.message) : e.message));
  }
});

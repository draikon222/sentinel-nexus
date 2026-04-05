const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080, verifyClient: (info, done) => {
    // Verificăm dacă clientul este autorizat să se conecteze
    if (info.origin !== 'http://localhost:8081') {
        done(false, 400);
    } else {
        done(true);
    }
} });

// Când un client (Android) se conectează
wss.on('connection', ws => {
    console.log('Aplicația Android s-a conectat.');
    ws.on('close', () => {
        console.log('Aplicația Android s-a deconectat.');
    });
});

// Funcție apelată când primim Webhook-ul cu #deploy
function broadcastLog(logData) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(logData)); // Trimitem log-ul instantaneu
        }
    });
}

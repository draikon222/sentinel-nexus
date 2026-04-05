// Backend (Node.js)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Primim Webhook de la GitHub
    wss.on('message', (message) => {
        console.log(`Received message: ${message}`);
        // Trimitem log-ul către Aplicația Android prin WebSocket
        ws.send(message);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

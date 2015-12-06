var WebSocketServer = require('ws').Server;
var messageHandler = require('./messageHandler');
var PORT_NUMBER = 8090;
var wss = new WebSocketServer({ port: PORT_NUMBER });

wss.on('connection', function connection(ws) {
    console.log('connection from a client');
    ws.on('message', function incoming(message) {
        var objMessage = JSON.parse(message);
        messageHandler.onMessage(ws, objMessage);
    });
    ws.on('close', function disconnection() {
        console.log("disconnection from peer " + ws.id);
        messageHandler.onClose(ws);
    });
});


console.log("started signaling server on port" + PORT_NUMBER);

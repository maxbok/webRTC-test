var connectedPeers = {};
var nextPeerId = 0;

function onMessage(ws, message){
    var type = message.type;
    switch (type) {
        case "ICECandidate":
            onICECandidate(message.ICECandidate, message.destination, ws.id);
            break;
        case "offer":
            onOffer(message.offer, message.destination, ws.id);
            break;
        case "answer":
            onAnswer(message.answer, message.destination, ws.id);
            break;
        case "init":
            onInit(ws);
            break;
        default:
            throw new Error("invalid message type");
    }
}

function onClose(ws) {
    delete connectedPeers[ws.id];
}

function onInit(ws){
    var id = nextPeerId;
    nextPeerId++;
    console.log("init from peer:", id);
    ws.id = id;
    connectedPeers[id] = ws;

    var peers = Object.keys(connectedPeers);
    var index = peers.indexOf(id);
    if (id > -1) {
        peers.splice(index, 1);
    }

    ws.send(JSON.stringify({
        type: 'attest_registration',
        peerId: id,
        otherPeers: peers
    }));
}

function onOffer(offer, destination, source){
    console.log("offer from peer:", source, "to peer", destination);
    connectedPeers[destination].send(JSON.stringify({
        type:'offer',
        offer:offer,
        source:source,
    }));
}

function onAnswer(answer, destination, source){
    console.log("answer from peer:", source, "to peer", destination);
    connectedPeers[destination].send(JSON.stringify({
        type: 'answer',
        answer: answer,
        source: source,
    }));
}

function onICECandidate(ICECandidate, destination, source){
    console.log("ICECandidate from peer:", source, "to peer", destination);
    connectedPeers[destination].send(JSON.stringify({
        type: 'ICECandidate',
        ICECandidate: ICECandidate,
        source: source,
    }));
}

module.exports.onMessage = onMessage;
module.exports.onClose = onClose;

//exporting for unit tests only
module.exports._connectedPeers = connectedPeers;

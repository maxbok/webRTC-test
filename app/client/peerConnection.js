function PeerConnection(signalingChannel, peerId) {

    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;

    var servers = {iceServers: [{urls: "stun:stun.1.google.com:19302"}]};

    var pc = new RTCPeerConnection(servers, {
        optional: [{
            DtlsSrtpKeyAgreement: true
        }]
    });

    pc.onicecandidate = function (evt) {
        if(evt.candidate){ // empty candidate (wirth evt.candidate === null) are often generated
            signalingChannel.sendICECandidate(evt.candidate, peerId);
        }
    };

    signalingChannel.onICECandidate = function (ICECandidate, source) {
        console.log("receiving ICE candidate from ",source);
        pc.addIceCandidate(new RTCIceCandidate(ICECandidate));
    };

    return pc;

}

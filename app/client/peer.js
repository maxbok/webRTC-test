function Peer() {
    var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;

    var wsUri = "ws://localhost:8090/";
    var signalingChannel = createSignalingChannel(wsUri);
    var servers = {iceServers: [{urls: "stun:stun.1.google.com:19302"}]};

    var self = this;

    function startCommunication(peerId) {
        var pc = new RTCPeerConnection(servers, {
            optional: [{
                DtlsSrtpKeyAgreement: true
            }]
        });

        signalingChannel.onAnswer = function (answer, source) {
            console.log('receive answer from ', source);
            pc.setRemoteDescription(new RTCSessionDescription(answer));
        };

        signalingChannel.onICECandidate = function (ICECandidate, source) {
            console.log("receiving ICE candidate from ",source);
            pc.addIceCandidate(new RTCIceCandidate(ICECandidate));
        };

        pc.onicecandidate = function (evt) {
            if(evt.candidate){ // empty candidate (wirth evt.candidate === null) are often generated
                signalingChannel.sendICECandidate(evt.candidate, peerId);
            }
        };

        //:warning the dataChannel must be opened BEFORE creating the offer.
        var _commChannel = pc.createDataChannel('communication', {
            reliable: false
        });

        pc.createOffer(function(offer){
            pc.setLocalDescription(offer);
            console.log('send offer');
            signalingChannel.sendOffer(offer, peerId);
        }, function (e){
            console.error(e);
        });

        window.channel = _commChannel;

        _commChannel.onclose = function(evt) {
            console.log("dataChannel closed");
        };

        _commChannel.onerror = function(evt) {
            console.error("dataChannel error");
        };

        _commChannel.onopen = function(){
            console.log("dataChannel opened");
            self.onChannelOpened(peerId, _commChannel);
        };

        _commChannel.onmessage = function(message){
            self.onMessageReceived(peerId, message.data);
        };
    }

    signalingChannel.onAttestRegistration = function (id, peers) {
        for (i = 0; i < peers.length; i++) {
            var peerId = peers[i];
            if (peerId != id) {
                startCommunication(peerId);
            }
        }
    };


    function createPeerConnection(peerId){
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

        pc.ondatachannel = function(event) {
          var receiveChannel = event.channel;
          console.log("channel received");
          self.onChannelOpened(peerId, receiveChannel);
          window.channel = receiveChannel;
          receiveChannel.onmessage = function(event){
            self.onMessageReceived(peerId, event.data);
          };
        };

        return pc;
    }

    signalingChannel.onOffer = function (offer, source) {
        console.log('receive offer');
        var peerConnection = createPeerConnection(source);
        peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        peerConnection.createAnswer(function(answer){
            peerConnection.setLocalDescription(answer);
            console.log('send answer');
            signalingChannel.sendAnswer(answer, source);
        }, function (e){
            console.error(e);
        });
    };

    //default handler, should be overriden 
    this.onChannelOpened = function(peerId, receiveChanned) {
        console.log("on channel opened");
    };

    //default handler, should be overriden 
    this.onMessageReceived = function(peerId, message) {
        console.log("on message received: " + message);
    };
}


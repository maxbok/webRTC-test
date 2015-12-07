function Peer() {
    var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;

    var wsUri = "ws://localhost:8090/";
    var signalingChannel = createSignalingChannel(wsUri);

    var self = this;

    signalingChannel.onAttestRegistration = function (id, peers) {
        self.onRegistration(id);
        for (i = 0; i < peers.length; i++) {
            var peerId = peers[i];
            if (peerId != id) {
                startCommunication(peerId);
            }
        }
    };

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

    function startCommunication(peerId) {
        var pc = new PeerConnection(signalingChannel, peerId);

        signalingChannel.onAnswer = function (answer, source) {
            console.log('receive answer from ', source);
            pc.setRemoteDescription(new RTCSessionDescription(answer));
        };

        //:warning the dataChannel must be opened BEFORE creating the offer.
        var channel = pc.createDataChannel('communication', {
            reliable: false
        });

        pc.createOffer(function(offer){
            pc.setLocalDescription(offer);
            console.log('send offer');
            signalingChannel.sendOffer(offer, peerId);
        }, function (e){
            console.error(e);
        });

        channel.onclose = function(evt) {
            console.log("dataChannel closed");
            self.onChannelClosed(peerId);
        };

        channel.onerror = function(evt) {
            console.error("dataChannel error");
        };

        channel.onopen = function(){
            console.log("dataChannel opened");
            self.onChannelOpened(peerId, channel);
        };

        channel.onmessage = function(message){
            self.onMessageReceived(peerId, message.data);
        };
    }

    function createPeerConnection(peerId){
        var pc = PeerConnection(signalingChannel, peerId);

        pc.ondatachannel = function(event) {
          var channel = event.channel;
          console.log("channel received");
          self.onChannelOpened(peerId, channel);

          channel.onmessage = function(event){
              self.onMessageReceived(peerId, event.data);
          };

          channel.onclose = function(evt) {
              self.onChannelClosed(peerId);
          };
        };

        return pc;
    }

    //default handler, should be overriden 
    this.onRegistration = function(id) {
        console.log("on registration");
    };

    //default handler, should be overriden 
    this.onChannelOpened = function(peerId, receiveChanned) {
        console.log("on channel opened");
    };

    //default handler, should be overriden 
    this.onChannelClosed = function(peerId) {
        console.log("on channel closed");
    };

    //default handler, should be overriden 
    this.onMessageReceived = function(peerId, message) {
        console.log("on message received: " + message);
    };
}


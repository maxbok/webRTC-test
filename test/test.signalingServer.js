require('should');
var sinon = require('sinon');
var messageHandler = require('../app/server/messageHandler');

var WsMock = function(){
    this.send = function(){};
};

describe('signalingServer', function() {

    describe('onInit', function() {

        var message;
        beforeEach(function() {
            message = {
                type:"init"
            };
        });

        it('sets the ws id and adds it to the connected peers', function() {
            var ws = new WsMock();
            messageHandler.onMessage(ws, message);

            ws.id.should.be.equal(0);
            messageHandler._connectedPeers[0].should.be.equal(ws);
        });

        it('sends the list of the connected peers', function() {
            ws1 = new WsMock();
            ws1.id = 0;
            ws2 = new WsMock();
            ws2.id = 1;

            messageHandler._connectedPeers[0] = ws1;

            var spy = sinon.spy(ws2, "send");

            messageHandler.onMessage(ws2, message);

            var expectedResponse = '{"type":"attest_registration","peerId":1,"otherPeers":["0"]}';
            spy.firstCall.args[0].should.eql(expectedResponse);
        });
    });

    describe('Messages', function() {
        var spy, ws1, ws2;
        beforeEach(function() {
            ws1 = new WsMock();
            ws1.id = 1;
            ws2 = new WsMock();
            ws2.id = 2;

            messageHandler._connectedPeers[1] = ws1;
            messageHandler._connectedPeers[2] = ws2;
            spy = sinon.spy(messageHandler._connectedPeers[2], "send");
        });
        afterEach(function() {
            spy.restore();
        });

        it('onOffer', function() {
            var offerSDP = "offer SDP";
            var message = {
                type:"offer",
                offer:offerSDP,
                destination:2,
            };
            messageHandler.onMessage(ws1, message);
            spy.calledOnce.should.be.true;

            var expectedResponse = '{"type":"offer","offer":"offer SDP","source":1}';
            spy.firstCall.args[0].should.eql(expectedResponse);
        });
        it('onAnswer', function() {
            var answerSDP = "answer SDP";
            var message = {
                type:"answer",
                answer:answerSDP,
                destination:2,
            };
            messageHandler.onMessage(ws1, message);
            spy.calledOnce.should.be.true;

            var expectedResponse = '{"type":"answer","answer":"answer SDP","source":1}';
            spy.firstCall.args[0].should.eql(expectedResponse);
        });
        it('onICECandidate', function() {
            var ICECandidateSDP = "ICECandidate SDP";
            var message = {
                type:"ICECandidate",
                ICECandidate:ICECandidateSDP,
                destination:2,
            };
            messageHandler.onMessage(ws1, message);
            spy.calledOnce.should.be.true;

            var expectedResponse = '{"type":"ICECandidate","ICECandidate":"ICECandidate SDP","source":1}';
            spy.firstCall.args[0].should.eql(expectedResponse);
        });
    });

});

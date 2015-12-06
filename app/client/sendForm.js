function createSendForm(peerId, elementId, buttonCallback) {

    var cell = document.getElementById(elementId);
    var textArea = document.createElement("textarea");
    textArea.id = elementId + "_text";
    cell.appendChild(textArea);

    var button = document.createElement("button");
    var buttonText = document.createTextNode("send");
    button.appendChild(buttonText);
    cell.appendChild(button);

    button.onclick = function() {
        buttonCallback(textArea.value);
    };

}

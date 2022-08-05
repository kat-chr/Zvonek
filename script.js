let client = new Paho.MQTT.Client("d57a0d1c39d54550b147b58411d86743.s2.eu.hivemq.cloud", 8884, "letni-skola" + Math.random());
let displayingCamera = false;
let callConnected = false;
let mailboxOpen = false;
let flagUp = false;
let toggleLed = 0;

client.connect({
    onSuccess: onConnect,
    userName: "robot",
    password: "P@ssW0rd!",
    useSSL: true
});

function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    console.log("onConnect");
    let origin = document.querySelector("#origin").getAttribute("data-value"); // dostat z data-value dostat value
    if (origin == "mobile") {
        client.onMessageArrived = onMessageArrivedOnMobile;
    } else if (origin == "monitor") {
       client.onMessageArrived = onMessageArrived;
    } else {
        alert("Je tu BLBOST!!!!! Neznama volajici stranka!");
    }
    client.subscribe("/smart-doorbell/photo/taken");
    client.subscribe("/smart-doorbell/button/#");
    client.subscribe("/smart-doorbell/distance/measured");
}

function onMessageArrivedOnMobile(message) {
    console.log("onMessageArrived:" + message.destinationName);
    console.log("onMessageArrived:" + message.payloadString);
    if(message.destinationName.startsWith("/smart-doorbell/photo/taken")) {
        publishPhoto(message);
    }
}

function onMessageArrived(message) {
    console.log("onMessageArrived:" + message.destinationName);
    console.log("onMessageArrived:" + message.payloadString);

    if((message.destinationName.startsWith("/smart-doorbell/button/")) && (message.payloadString == "pressed")) {
        let buttonNumber = message.destinationName.split("/")[3];
        console.log(buttonNumber);
        if (buttonNumber == "17") {
            console.log("pressed")
            turnDoorbellOn();
            if (displayingCamera == false) {
                turnCameraOn();
            }
        } else if (buttonNumber == "27") {
            toggleRecording();
        } else if (buttonNumber == "22") {
            toggleCall();
        } else if (buttonNumber == "10") {
            toggleMailbox();
        } else if (buttonNumber == "9") {
            putFlagDown();
        } 
    }
    if ((message.destinationName.startsWith("/smart-doorbell/button/17")) && (message.payloadString == "released")) {
        console.log("zvonek released");
        turnLedOff(23);
    }
    if (message.destinationName.startsWith("/smart-doorbell/distance/measured")) {
        packageArrived();
    }
    if(message.destinationName.startsWith("/smart-doorbell/photo/taken")) {
        publishPhoto(message);
    }
}

function servo1(){
    let message = new Paho.MQTT.Message(document.querySelector("#servoUhel").value);
    message.destinationName = "/smart-doorbell/servo/12";
    client.send(message);
}

function toggleRecording() {
    if (displayingCamera == false) {
        turnCameraOn();
    } else {
        turnCameraOff()
    }
}

function turnCameraOn() {
    let message = new Paho.MQTT.Message("recording-start-vflip");
    message.destinationName = "/smart-doorbell/photo";
    client.send(message);
    displayingCamera = true;
}

function turnCameraOff() {
    let message = new Paho.MQTT.Message("recording-stop");
    message.destinationName = "/smart-doorbell/photo";
    client.send(message);
    let visualPhoto = document.querySelector("#photo");
    visualPhoto.src = "black.png"
    displayingCamera = false;
}

function makeSnapshot() {
    let message = new Paho.MQTT.Message("snapshot-vflip");
    message.destinationName = "/smart-doorbell/photo";
    client.send(message);
}

function publishPhoto(message) {
    if (message.payloadString == "camera-off") {
        turnCameraOff();
    }
    if (displayingCamera == false) {
        return;
    }
    let visualPhoto = document.querySelector("#photo");
    visualPhoto.src = message.payloadString;

    //console.log("obrazek: " + message.payloadString);
}

function lightUp(pinNumber){
    let message = new Paho.MQTT.Message("on");
    let destination = "/smart-doorbell/led/" + pinNumber;
    message.destinationName = destination;
    client.send(message);
}


//let toggleLastTime = 0;

function useButtonToLightUp(pinNumber) {
    // let currentTime = Date.now();
    // if(toggleLastTime + 300 > currentTime) {
    //     return;
    // }
    if(toggleLed == 0){
        turnLedOn(pinNumber);
        toggleLed = 1;
        // toggleLastTime = currentTime;
    } else {
        turnLedOff(pinNumber);
        toggleLed = 0;
        // toggleLastTime = currentTime;
    }
}

function turnLedOff(pinNumber) {
    let message = new Paho.MQTT.Message("off");
    message.destinationName = "/smart-doorbell/led/" + pinNumber;
    client.send(message);
}

function turnLedOn(pinNumber) {
    let message = new Paho.MQTT.Message("on");
    message.destinationName = "/smart-doorbell/led/" + pinNumber;
    client.send(message);
}

function turnDoorbellOn() {
    let message = new Paho.MQTT.Message("ring");
    message.destinationName = "/smart-doorbell/sound/1";
    client.send(message);

    let message2 = new Paho.MQTT.Message("ring");
    message2.destinationName = "/smart-doorbell/sound/2";
    client.send(message2);

    turnLedOn(23);
}

function toggleCall() {
    if (callConnected == false) {
        turnCallOn();
    } else {
        turnCallOff();
    }
}

function turnCallOn() {
    let message = new Paho.MQTT.Message("phone-call-start");
    message.destinationName = "/smart-doorbell/sound";
    client.send(message);
    callConnected = true;
}

function turnCallOff() {
    let message = new Paho.MQTT.Message("phone-call-stop");
    message.destinationName = "/smart-doorbell/sound";
    client.send(message);
    callConnected = false;
}

function toggleMailbox() {
    if (mailboxOpen == false) {
        openMailbox();
    } else {
        closeMailbox();
    }
}

function openMailbox() {
    let message = new Paho.MQTT.Message("180");
    message.destinationName = "/smart-doorbell/servo/12";
    client.send(message);
    mailboxOpen = true;
}

function closeMailbox() {
    let message = new Paho.MQTT.Message("65");
    message.destinationName = "/smart-doorbell/servo/12";
    client.send(message);
    mailboxOpen = false;
    tellMeWhenPackigeArrivesInMailbox();
}

function toggleFlag() {
    if (flagUp == false) {
        putFlagUp();
    } else {
        putFlagDown();
    }
}

function putFlagUp() {
    let message = new Paho.MQTT.Message("90");
    message.destinationName = "/smart-doorbell/servo/13";
    client.send(message);
    flagUp = true;
}

function putFlagDown() {
    let message = new Paho.MQTT.Message("270");
    message.destinationName = "/smart-doorbell/servo/13";
    client.send(message);
    flagUp = false;
}

function tellMeWhenPackigeArrivesInMailbox() { // kam to dat??
    let message = new Paho.MQTT.Message("notify-when-shorter-then(15.678)");
    message.destinationName = "/smart-doorbell/distance";
    client.send(message);
}

function packageArrived() {
    console.log("package!!!!!");
    if (flagUp == false) {
        toggleFlag();
    }
}








// setTimeout(function () {
//     toggleMailbox()
//     toggleMailbox()
// }, 2000)

// function zapnoutZvonek2(){
//     casovac2 = setInterval(function(){
//         message = new Paho.MQTT.Message("ring");
//         message.destinationName = "/smart-doorbell/sound/2";
//         client.send(message);
//     }, 0.1)
// }

// function stopThisMadness2() {
//     clearInterval(casovac2);
// }

// function zapnoutZvonek1(){
//     casovac = setInterval(function(){
//         message = new Paho.MQTT.Message("ring");
//         message.destinationName = "/smart-doorbell/sound/1";
//         client.send(message);
//     }, 0.1)
// }

// function stopThisMadness1() {
//     clearInterval(casovac);
// }
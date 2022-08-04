let client = new Paho.MQTT.Client("d57a0d1c39d54550b147b58411d86743.s2.eu.hivemq.cloud", 8884, "letni-skola" + Math.random());
let displayingCamera = false;
let callConnected = false;


client.connect({
    onSuccess: onConnect,
    userName: "robot",
    password: "P@ssW0rd!",
    useSSL: true
});

function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    console.log("onConnect");
    client.onMessageArrived = onMessageArrived;
    client.subscribe("/smart-doorbell/photo/taken");
    client.subscribe("/smart-doorbell/button/#");
}

function onMessageArrived(message) {
    console.log("onMessageArrived:" + message.destinationName);
    console.log("onMessageArrived:" + message.payloadString);
    publishPhoto(message);
    
    if((message.destinationName.startsWith("/smart-doorbell/button/")) && (message.payloadString == "pressed")) {
        let buttonNumber = message.destinationName.split("/")[3];
        console.log(buttonNumber);
        if (buttonNumber == "17") {
            turnDoorbellOn();
            if (displayingCamera == false) {
                turnCameraOn();
            }
        } else if (buttonNumber == "27") {
            toggleRecording();
        } else if (buttonNumber == "22") {
            toggleCall();
        } else if (buttonNumber == "10") {
            useButtonToLightUp(24);
        } else if (buttonNumber == "9") {
            useButtonToLightUp(24);
        } 
    }
    if ((message.destinationName.startsWith("/smart-doorbell/button/17")) && (message.payloadString == "released")) {
        turnLedOff(23);
    }
}

let toggleLed = 0;


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
    visualPhoto.src = "black.jpg"
    displayingCamera = false;
}

function makeSnapshot() {
    let message = new Paho.MQTT.Message("snapshot-vflip");
    message.destinationName = "/smart-doorbell/photo";
    client.send(message);
}

function publishPhoto(message) {
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
        callConnected = true;
    } else {
        turnCallOff();
        callConnected = false;
    }
}

function turnCallOn() {
    let message = new Paho.MQTT.Message("phone-call-start");
    message.destinationName = "/smart-doorbell/sound";
    client.send(message);
}


function turnCallOff() {
    let message = new Paho.MQTT.Message("phone-call-stop");
    message.destinationName = "/smart-doorbell/sound";
    client.send(message);
}
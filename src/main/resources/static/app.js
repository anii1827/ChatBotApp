var stompClient = null;
var socket = null;
var isConnected = false;
var userName='';
var nickName='';
var websocketEndPoint="/websocket";


if(localStorage.getItem("userName") && localStorage.getItem("nickName")){
    window.location.href = '/home.html';
}

function connect() {
    console.log("Attempting to connect...");

    // Get user details from the form
    userName = document.getElementById('username').value;
    nickName = document.getElementById('nickname').value;

    if (!userName || !nickName) {
        alert("Username and Nickname are required.");
        return;
    }
    if (isConnected) {
        console.log("Already connected. Disconnecting...");
        disconnect();
    }

    console.log("Initializing stompClient and WebSocket...");
    socket = new SockJS(websocketEndPoint); 
    stompClient = Stomp.over(socket);


    console.log("Opening Web Socket...");
    stompClient.connect({}, function(frame) {
        onConnected(frame, userName, nickName);
    }, onError);
}

function onConnected(frame, userName, nickName) {
    console.log("Connected successfully: " + frame);
    console.log(`User: ${userName}, Nickname: ${nickName}`);

    isConnected = true;
    stompClient.send("/app/chat.addUser", {}, JSON.stringify({
        "userName": userName,
        "nickName": nickName,
        "status": "ONLINE"
    }));

    localStorage.setItem("userName",userName);
    localStorage.setItem("nickName",nickName);
    window.location.href = '/home.html';
}

function onError(error) {
    console.error("Connection error: " + error);
    isConnected = false;

    // Retry the connection after a short delay
//    setTimeout(() => {
//        console.log("Retrying connection...");
//        connect();
//    }, 5000); // Retry every 5 seconds
}

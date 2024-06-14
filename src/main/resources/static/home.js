var stompClient = null;
var socket = null;
var isConnected = false;
var userName='';
var nickName='';
var activeUsersURL = "/chat/ActiveUser";
var chatMessagesURL = "/chat/sender/receiver";
var sendMessaageURL = "/app/chat/users";
var sidePanel = document.getElementById('online-users');
var selecteduserInfo = document.getElementById('selected-user-name');
var loggedUserInfo = document.getElementById('user-name');
var selectedUser;
var selectedUserName;
var chatMessagePanel = document.getElementById('chat-messages');
var chatInputPanel = document.getElementById('chat-input');
var chatMessageWindow = document.getElementById("chat-messages");
var notification = "notifcation_badge_";
var notificationMap = new Map();
var websocketEndPoint="/websocket";

if(localStorage.getItem("userName") && localStorage.getItem("nickName")){
    showChatWindow();
    connect();
}else{
    window.location.href = '/index.html';
}

function connect() {
    userName = localStorage.getItem("userName",userName);
    nickName = localStorage.getItem("nickName",nickName);

    loggedUserInfo.textContent = capitalizeFirstLetter(userName);
    console.log("Attempting to connect...");
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
    displayOnlineUsers();

    stompClient.subscribe(`/user/${userName}/queue/messages`, onMessageReceived);
    stompClient.subscribe("/topic/publish", onUsersActivity);
}

function showChatWindow(){
    let hiddenStyleClass = 'chat_window_hidden';
    if(isAnyActiveUserSelected()){
        this.chatInputPanel.classList.remove(hiddenStyleClass);
        this.chatMessagePanel.classList.remove(hiddenStyleClass);
    }else{
        this.chatInputPanel.classList.add(hiddenStyleClass);
        this.chatMessagePanel.classList.add(hiddenStyleClass);
    }
}

function onMessageReceived(message) {
    let convertedMessage = JSON.parse(message.body);

    if(convertedMessage.senderId==selectedUserName){
        receiveDiv = createReceiverMessage(convertedMessage);
        chatMessageWindow.appendChild(receiveDiv);
    }else{
        if(notificationMap.has(convertedMessage.senderId)){
            notificationMap.set(convertedMessage.senderId, notificationMap.get(convertedMessage.senderId)+1);
        }
        else{
            notificationMap.set(convertedMessage.senderId,1);
        }
        updateNotfication(convertedMessage.senderId, notificationMap.get(convertedMessage.senderId));
    }
}

function updateNotfication(senderId, totalUnreadMessage){
    let userNotify = document.getElementById(notification+senderId);
    userNotify.textContent = totalUnreadMessage;
    
    if(totalUnreadMessage==1){
        userNotify.classList.add('notification-badge-show');
    }

}

function onUsersActivity(message){
    let item = JSON.parse(message.body);
    if(item.userName==userName){
        return;
    }
    if(item.status=="OFFLINE"){
        removeDisconnectedUser(item);
        return;
    }
    let user = createUserDiv(item);
    sidePanel.appendChild(user);
}

function removeDisconnectedUser(item){
    const activeUsers = document.querySelectorAll('div[state="activeUser"]');
    let deactiveUser;
    activeUsers.forEach((activeUser)=>{
        const firstChild = activeUser.firstElementChild;
        if(firstChild && firstChild.getAttribute('username')==item.userName){
            deactiveUser = activeUser;
        }
    });
    deactiveUser.parentElement.removeChild(deactiveUser);
    
}


async function displayOnlineUsers(){
    const response = await fetch(activeUsersURL);
    const data = await response.json();

    data.filter((item)=>item.userName!=userName).forEach(item=>{
        let user = createUserDiv(item);
        sidePanel.appendChild(user);
    })
    
}

function createUserDiv(item){
    const userContainer = document.createElement('div');
    userContainer.setAttribute("state","activeUser");
    const user = document.createElement('div');
    user.classList.add('user');

    //user image
    const userImg = document.createElement('img');
    userImg.classList.add('user-image');
    userImg.alt=item.userName;
    userImg.src="receiver_image.png";

    //username span
    const userspan = document.createElement('span');
    userspan.textContent=item.nickName;

    //notfiation span
    const notifcationBadge = document.createElement('span');
    notifcationBadge.id = notification+item.userName;
    notifcationBadge.classList.add("notification-badge");
    

    user.appendChild(userImg);
    user.appendChild(userspan);
    user.appendChild(notifcationBadge);

    //line
    userContainer.appendChild(user);
    user.setAttribute("userName", item.userName);
    userContainer.appendChild(document.createElement('hr'));
    onUserSelectListener(userContainer);
    return userContainer;
}

function onUserSelectListener(userContainer){
    userContainer.addEventListener('click', (event)=>{
        if(selectedUser!=undefined){
            selectedUser.classList.remove('selected-user');
        }

        if(event.target.tagName=='SPAN' || event.target.tagName=='IMG'){
            selectedUser = event.target.parentNode;
        }else{
            selectedUser = event.target;
        }
        selectedUser.classList.add('selected-user');
        selectedUserName = selectedUser.getAttribute("userName");
        
        showChatWindow();
        updateChatWindow();
        updateNotficationBadge();
        toggleSidePanel();
        setActiveUserTag();
    })
}

function setActiveUserTag(){
    selecteduserInfo.textContent = capitalizeFirstLetter(selectedUserName);
}

function updateNotficationBadge(){
    notificationMap.delete(selectedUserName);
    document.getElementById(notification+selectedUserName).classList.remove('notification-badge-show');
    document.getElementById(notification+selectedUserName).textContent='';
    
}
async function updateChatWindow(){
    let selectUserName = selectedUser.getAttribute("userName");
    let specficUrl = chatMessagesURL.replace("sender", userName).replace("receiver", selectUserName);
    const response = await fetch(specficUrl);
    const messages = await response.json();
    displayMessages(messages);
}

function displayMessages(messages){
    chatMessageWindow.innerHTML='';
    messages.forEach((message)=>{
        let messageDiv;
        if(message.senderId==userName){
            messageDiv = createSenderMessage(message);
        }else{
            messageDiv = createReceiverMessage(message);
        }
        chatMessageWindow.appendChild(messageDiv);
    }) 
}
/*  <div class="message received">
        <img src="receiver_image.png" alt="User 1" class="user-image">
        <div class="bubble">Hello, how are you?</div>
    </div>
    <div class="message sent">
        <div class="bubble">I'm good, thank you!</div>
        <img src="sender_image.png" alt="User 2" class="user-image">
    </div>
*/

function createSenderMessage(message){
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message');
    messageContainer.classList.add('sent');
    

    //image tage
    const userImg = document.createElement('img');
    userImg.classList.add('user-image');
    userImg.src="receiver_image.png";
    // userImg.alt=item.userName;

    //message div
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('bubble');
    messageDiv.textContent=message.content;

    messageContainer.appendChild(userImg);
    messageContainer.appendChild(messageDiv);
    
    return messageContainer;
}

function createReceiverMessage(message){
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message');
    messageContainer.classList.add('received');
    

    //image tage
    const userImg = document.createElement('img');
    userImg.classList.add('user-image');
    userImg.src="receiver_image.png";
    // userImg.alt=item.userName;

    //message div
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('bubble');
    messageDiv.textContent=message.content;

    messageContainer.appendChild(userImg);
    messageContainer.appendChild(messageDiv);
    
    return messageContainer;
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

function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect(() => {
            console.log("Disconnected");
            isConnected = false;
        });
    }
}

function logOut(){
    stompClient.send("/app/chat.disconnectUser", {}, JSON.stringify({
       "userName": userName,
       "nickName": nickName,
       "status": "OFFLINE"
   }));

   localStorage.removeItem("userName");
   localStorage.removeItem("nickName");
   window.location.href = '/index.html';
}

function capitalizeFirstLetter(string) {
    return string.split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

function isAnyActiveUserSelected(){
    return selectedUser!=undefined;
}


function sendMessage(){
    const messageInput = document.getElementById("messageInput");
    let message = messageInput.value;
    
    if(!message){
        alert("message should not be empty");
        return;
    }
    
    let messageObj = {
        "senderId":userName,
        "receiverId":selectedUserName,
        "content":message
    }

    let sender = createSenderMessage(messageObj);
    chatMessageWindow.appendChild(sender);
    stompClient.send(sendMessaageURL, {}, JSON.stringify(messageObj));

    messageInput.value = "";
}


function toggleSidePanel() {
    var sidePanel = document.getElementById("side-panel");
    sidePanel.classList.toggle("show");
    
    var chatWindow = document.querySelector(".chat-window");
    chatWindow.classList.toggle("show-side-panel");
}
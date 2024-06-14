package com.example.demo.controller;

import com.example.demo.entities.Message;
import com.example.demo.entities.User;
import com.example.demo.model.Status;
import com.example.demo.services.MessageService;
import com.example.demo.services.UserService;
import jakarta.websocket.server.PathParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class ChatRoomController {

    @Autowired
    MessageService messageService;

    @Autowired
    UserService userService;

    @Autowired
    SimpMessagingTemplate simpMessagingTemplate;

    @GetMapping("/chat/{sender}/{receiver}")
    public ResponseEntity<?> getAllMessages(@PathVariable("sender") String sender, @PathVariable("receiver") String receiver){
        var messages = messageService.getAllMessages(sender, receiver);
        System.out.println("messages"+messages);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/chat/ActiveUser")
    public ResponseEntity<?> getAllActiveUsers(){
        return ResponseEntity.ok(this.userService.getAllActiveUsers());
    }

    @MessageMapping("/chat/users")
    public void saveMessage(@Payload Message message){
        var mess = messageService.saveMessage(message);
        System.out.println(mess);
        simpMessagingTemplate.convertAndSendToUser(mess.getReceiverId(), "/queue/messages", message);
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/publish")
    public User addUser(@Payload User user){
        System.out.println("adding : "+user);
        return this.userService.createUser(user.getUserName(), user.getNickName());
    }

    @MessageMapping("/chat.disconnectUser")
    @SendTo("/topic/publish")
    public User disconnectUser(@Payload User user){
        System.out.println("disconnect = "+user);
        boolean isDisconnected = this.userService.disconnectUser(user.getUserName());
        if(isDisconnected){
            user.setStatus(Status.OFFLINE);
        }
        return user;
    }

}

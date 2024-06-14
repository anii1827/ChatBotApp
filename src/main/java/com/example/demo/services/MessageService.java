package com.example.demo.services;

import com.example.demo.entities.Message;
import com.example.demo.repostory.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;

import java.sql.Array;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class MessageService {

    @Autowired
    ChatRoomService chatRoomService;

    @Autowired
    MessageRepository messageRepository;

    public List<Message> getAllMessages(String sender, String receiver){
        var chatId = chatRoomService.findChatId(sender, receiver, false);
        System.out.println("chatID = "+chatId);
        return chatId.map(messageRepository::findByChatId)
                .orElse(new ArrayList<Message>());
    }

    public Message saveMessage(Message message){
        var chatId = chatRoomService.findChatId(message.getSenderId(), message.getReceiverId(), true);
        message.setChatId(chatId.orElseThrow(()->new RuntimeException(String.format("unable to find chatId for chatRoom of sender (%s) and receiver(%s)", message.getSenderId(), message.getReceiverId()))));
        message.setTimeStamp(LocalDateTime.now().toString());
        return messageRepository.save(message);
    }


}

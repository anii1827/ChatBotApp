package com.example.demo.services;

import com.example.demo.entities.ChatRoom;
import com.example.demo.repostory.ChatRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChatRoomService {

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    public Optional<String> findChatId(String senderId, String receiverId, boolean newChatRoom){
        var chatRoom = this.chatRoomRepository.findBySenderIdAndReceiverId(senderId, receiverId);
        return chatRoom.map(ChatRoom::getChatId)
                .or(()->{
                    if(newChatRoom){
                        return createChatId(senderId, receiverId);
                    }
                    return Optional.empty();
                });
    }

    private Optional<String> createChatId(String senderId, String receiverId) {
        var chatId = String.format("%s_%s", senderId, receiverId);
        ChatRoom sender = new ChatRoom();
        sender.setChatId(chatId);
        sender.setReceiverId(receiverId);
        sender.setSenderId(senderId);

        ChatRoom receiver = new ChatRoom();
        receiver.setChatId(chatId);
        receiver.setReceiverId(senderId);
        receiver.setSenderId(receiverId);

        chatRoomRepository.saveAll(List.of(sender, receiver));
        return Optional.of(chatId);
    }
}

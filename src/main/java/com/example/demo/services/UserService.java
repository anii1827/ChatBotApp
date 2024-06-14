package com.example.demo.services;

import com.example.demo.entities.User;
import com.example.demo.model.Status;
import com.example.demo.repostory.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    UserRepository userRepository;

    public User createUser(final String userName, final String nickName) {
        var optionalUser = this.userRepository.findById(userName);
        if(optionalUser.isEmpty()){
            return this.userRepository.save(new User(userName.trim(), nickName.trim(), Status.ONLINE));
        }
        var user = optionalUser.get();
        user.setStatus(Status.ONLINE);
        return userRepository.save(user);
    }

    public boolean disconnectUser(String userName){
        var user = this.userRepository.findById(userName).orElseThrow(()-> new RuntimeException(String.format("not User found with id : %s", userName)));;
        user.setStatus(Status.OFFLINE);
        userRepository.save(user);
        return true;
    }

    public List<User> getAllActiveUsers(){
        return this.userRepository.findAll().stream().filter((user)->user.getStatus().equals(Status.ONLINE)).collect(Collectors.toList());
    }

}

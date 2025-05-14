package pl.myproject.kanbanproject2.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import pl.myproject.kanbanproject2.chat.ChatMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendMessage(String destination, ChatMessage message) {
        log.info("Sending message to {}: {}", destination, message.getContent());
        messagingTemplate.convertAndSend(destination, message);
    }

    public void sendPrivateMessage(String username, ChatMessage message) {
        String destination = "/user/" + username + "/queue/messages";
        log.info("Sending private message to {}: {}", username, message.getContent());
        messagingTemplate.convertAndSendToUser(username, "/queue/messages", message);
    }
}

package pl.myproject.kanbanproject2.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import pl.myproject.kanbanproject2.chat.ChatMessage;
import pl.myproject.kanbanproject2.model.Chat;
import pl.myproject.kanbanproject2.repository.ChatRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRepository chatRepository;

    public void sendMessage(String destination, ChatMessage message) {
        log.info("Sending message to {}: {}", destination, message.getContent());
        messagingTemplate.convertAndSend(destination, message);


        saveMessageToDatabase(message);
    }

    public void sendPrivateMessage(String username, ChatMessage message) {
        String destination = "/user/" + username + "/queue/messages";
        log.info("Sending private message to {}: {}", username, message.getContent());
        messagingTemplate.convertAndSendToUser(username, "/queue/messages", message);

        saveMessageToDatabase(message);
    }

    private void saveMessageToDatabase(ChatMessage message) {
        Chat entity = Chat.builder()
                .type(message.getType())
                .content(message.getContent())
                .sender(message.getSender())
                .roomId(message.getRoomId())
                .timestamp(message.getTimestamp())
                .recipientId(message.getRecipientId())
                .build();

        chatRepository.save(entity);
        log.info("Message saved to database: {}", entity.getId());
    }
}
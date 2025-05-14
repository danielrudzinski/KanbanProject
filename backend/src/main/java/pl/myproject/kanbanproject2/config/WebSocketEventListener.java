package pl.myproject.kanbanproject2.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import pl.myproject.kanbanproject2.chat.ChatMessage;
import pl.myproject.kanbanproject2.chat.MessageType;

import java.time.LocalDateTime;

@Component
@Slf4j
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SimpMessageSendingOperations messagingTemplate;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");

        if (username != null) {
            log.info("User disconnected: {}", username);
            var chatMessage = ChatMessage.builder()
                    .type(MessageType.LEAVE)
                    .sender(username)
                    .timestamp(LocalDateTime.now())
                    .build();

            if (roomId != null && !roomId.isEmpty()) {
                chatMessage.setRoomId(roomId);
                messagingTemplate.convertAndSend("/topic/room." + roomId, chatMessage);
                log.info("User {} left room: {}", username, roomId);
            } else {

                messagingTemplate.convertAndSend("/topic/public", chatMessage);
            }
        }
    }
}
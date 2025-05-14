package pl.myproject.kanbanproject2.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import pl.myproject.kanbanproject2.chat.ChatMessage;
import pl.myproject.kanbanproject2.chat.MessageType;
import pl.myproject.kanbanproject2.service.ChatService;

import java.time.LocalDateTime;
import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {

        if (chatMessage.getTimestamp() == null) {
            chatMessage.setTimestamp(LocalDateTime.now());
        }

        String destination = "/topic/public";
        if (chatMessage.getRoomId() != null && !chatMessage.getRoomId().isEmpty()) {
            destination = "/topic/room." + chatMessage.getRoomId();
        }

        chatService.sendMessage(destination, chatMessage);
    }

    @MessageMapping("/chat.sendPrivateMessage")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage) {
        if (chatMessage.getTimestamp() == null) {
            chatMessage.setTimestamp(LocalDateTime.now());
        }
        chatMessage.setType(MessageType.PRIVATE);

        chatService.sendPrivateMessage(chatMessage.getRecipientId(), chatMessage);

        chatService.sendPrivateMessage(chatMessage.getSender(), chatMessage);
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessage chatMessage,
                        SimpMessageHeaderAccessor headerAccessor) {

        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());

        if (chatMessage.getRoomId() != null && !chatMessage.getRoomId().isEmpty()) {
            headerAccessor.getSessionAttributes().put("roomId", chatMessage.getRoomId());
            chatMessage.setType(MessageType.JOIN);
            chatMessage.setTimestamp(LocalDateTime.now());

            chatService.sendMessage("/topic/room." + chatMessage.getRoomId(), chatMessage);
            log.info("User {} joined room: {}", chatMessage.getSender(), chatMessage.getRoomId());
        } else {

            chatMessage.setType(MessageType.JOIN);
            chatMessage.setTimestamp(LocalDateTime.now());
            chatService.sendMessage("/topic/public", chatMessage);
            log.info("User joined public chat: {}", chatMessage.getSender());
        }
    }

    @MessageMapping("/chat.leaveRoom/{roomId}")
    public void leaveRoom(@DestinationVariable String roomId,
                          Principal principal,
                          SimpMessageHeaderAccessor headerAccessor) {

        String username = principal.getName();
        ChatMessage chatMessage = ChatMessage.builder()
                .type(MessageType.LEAVE)
                .sender(username)
                .roomId(roomId)
                .timestamp(LocalDateTime.now())
                .build();

        chatService.sendMessage("/topic/room." + roomId, chatMessage);
        log.info("User {} left room: {}", username, roomId);
    }
}
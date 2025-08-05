package pl.myproject.kanbanproject2.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import pl.myproject.kanbanproject2.chat.ChatMessage;
import pl.myproject.kanbanproject2.chat.MessageType;
import pl.myproject.kanbanproject2.chat.ChatService;

import java.security.Principal;
import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private static final int MAX_MESSAGE_LENGTH = 2000;

    private final ChatService chatService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage, Principal principal) {
        String sender = authenticatedUsername(principal);
        prepareMessage(chatMessage, sender, MessageType.CHAT);

        String destination = "/topic/public";
        if (chatMessage.getRoomId() != null && !chatMessage.getRoomId().isEmpty()) {
            destination = "/topic/room." + chatMessage.getRoomId();
        }

        chatService.sendMessage(destination, chatMessage);
    }

    @MessageMapping("/chat.sendPrivateMessage")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage, Principal principal) {
        String sender = authenticatedUsername(principal);
        prepareMessage(chatMessage, sender, MessageType.PRIVATE);

        if (chatMessage.getRecipientId() == null || chatMessage.getRecipientId().isBlank()) {
            throw new IllegalArgumentException("A private message recipient is required");
        }

        chatService.sendPrivateMessage(chatMessage.getRecipientId(), sender, chatMessage);
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessage chatMessage,
                        Principal principal,
                        SimpMessageHeaderAccessor headerAccessor) {
        String sender = authenticatedUsername(principal);

        chatMessage.setSender(sender);
        chatMessage.setType(MessageType.JOIN);
        chatMessage.setTimestamp(LocalDateTime.now());

        headerAccessor.getSessionAttributes().put("username", sender);

        if (chatMessage.getRoomId() != null && !chatMessage.getRoomId().isEmpty()) {
            headerAccessor.getSessionAttributes().put("roomId", chatMessage.getRoomId());

            chatService.sendMessage("/topic/room." + chatMessage.getRoomId(), chatMessage);
            log.info("User {} joined room: {}", sender, chatMessage.getRoomId());
        } else {
            chatService.sendMessage("/topic/public", chatMessage);
            log.info("User joined public chat: {}", sender);
        }
    }

    @MessageMapping("/chat.leaveRoom/{roomId}")
    public void leaveRoom(@DestinationVariable String roomId,
                          Principal principal) {

        String username = authenticatedUsername(principal);
        ChatMessage chatMessage = ChatMessage.builder()
                .type(MessageType.LEAVE)
                .sender(username)
                .roomId(roomId)
                .timestamp(LocalDateTime.now())
                .build();

        chatService.sendMessage("/topic/room." + roomId, chatMessage);
        log.info("User {} left room: {}", username, roomId);
    }

    private void prepareMessage(ChatMessage chatMessage, String sender, MessageType type) {
        if (chatMessage == null) {
            throw new IllegalArgumentException("Message content is required");
        }
        if (chatMessage.getContent() == null || chatMessage.getContent().isBlank()) {
            throw new IllegalArgumentException("Message content is required");
        }
        String normalizedContent = chatMessage.getContent().trim();
        if (normalizedContent.length() > MAX_MESSAGE_LENGTH) {
            throw new IllegalArgumentException("Message content is too long");
        }

        chatMessage.setSender(sender);
        chatMessage.setType(type);
        chatMessage.setContent(normalizedContent);
        chatMessage.setTimestamp(LocalDateTime.now());
    }

    private String authenticatedUsername(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalArgumentException("The user is not authenticated");
        }
        return principal.getName();
    }
}
package pl.myproject.kanbanproject2.chat;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatMessage {

    private MessageType type;
    private String content;
    private String sender;
    private String roomId;
    private LocalDateTime timestamp;
    private String recipientId;

    public static ChatMessage createMessage(String content, String sender, String roomId) {
        return ChatMessage.builder()
                .type(MessageType.CHAT)
                .content(content)
                .sender(sender)
                .roomId(roomId)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
package pl.myproject.kanbanproject2.dto;

public record TaskUpdateDTO(
        String title,
        Integer columnId,
        Integer userId
) {}

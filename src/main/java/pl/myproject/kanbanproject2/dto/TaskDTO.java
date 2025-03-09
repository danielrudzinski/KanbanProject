package pl.myproject.kanbanproject2.dto;

public record TaskDTO(Integer id, String title, Integer columnId, Integer userId) {
}

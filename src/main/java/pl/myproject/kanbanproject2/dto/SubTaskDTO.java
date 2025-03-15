package pl.myproject.kanbanproject2.dto;
public record SubTaskDTO(
        Integer id,
        String title,
        String description,
        boolean completed,
        Integer taskId
) {}
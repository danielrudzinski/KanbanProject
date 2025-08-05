package pl.myproject.kanbanproject2.task.subtask;

public record SubTaskDto(Integer id, String title, String description, boolean completed, Integer position,
                         Integer taskId) {
}
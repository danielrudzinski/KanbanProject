package pl.myproject.kanbanproject2.layout.column;

import pl.myproject.kanbanproject2.task.TaskDto;

public record ColumnDto(Integer id, String name, Integer position, Integer wipLimit, java.util.List<TaskDto> taskDTO) {
}
package pl.myproject.kanbanproject2.layout.row;

import pl.myproject.kanbanproject2.task.TaskDto;

public record RowDto(Integer id, String name, Integer position, Integer wipLimit, java.util.List<TaskDto> taskDTO) {
}
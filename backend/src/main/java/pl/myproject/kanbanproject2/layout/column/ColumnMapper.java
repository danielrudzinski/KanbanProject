package pl.myproject.kanbanproject2.layout.column;

import org.springframework.stereotype.Component;
import pl.myproject.kanbanproject2.task.TaskMapper;

import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class ColumnMapper implements Function<Column, ColumnDto> {

    private final TaskMapper taskMapper;

    public ColumnMapper(TaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @Override
    public ColumnDto apply(Column column) {
        if (column == null) {
            return null;
        }

        var taskDtos = column.getTasks().stream()
                .map(taskMapper).collect(Collectors.toList());

        return new ColumnDto(
                column.getId(),
                column.getName(),
                column.getPosition(),
                column.getWipLimit(),
                taskDtos
        );
    }

    public ColumnResponseDto toResponseDto(Column column) {
        if (column == null) {
            return null;
        }

        return new ColumnResponseDto(
                column.getId(),
                column.getName(),
                column.getPosition(),
                column.getWipLimit()
        );
    }
}
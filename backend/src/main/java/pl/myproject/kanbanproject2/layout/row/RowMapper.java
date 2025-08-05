package pl.myproject.kanbanproject2.layout.row;

import org.springframework.stereotype.Component;
import pl.myproject.kanbanproject2.task.TaskMapper;

import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class RowMapper implements Function<Row, RowDto> {

    private final TaskMapper taskMapper;

    public RowMapper(TaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @Override
    public RowDto apply(Row row) {
        if (row == null) {
            return null;
        }

        var taskDtos = row.getTasks().stream()
                .map(taskMapper)
                .collect(Collectors.toList());

        return new RowDto(
                row.getId(),
                row.getName(),
                row.getPosition(),
                row.getWipLimit(),
                taskDtos
        );
    }

    public RowResponseDto toResponseDto(Row row) {
        if (row == null) {
            return null;
        }

        return new RowResponseDto(
                row.getId(),
                row.getName(),
                row.getPosition(),
                row.getWipLimit()
        );
    }
}
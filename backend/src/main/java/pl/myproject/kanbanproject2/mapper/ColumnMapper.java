package pl.myproject.kanbanproject2.mapper;

import org.springframework.stereotype.Component;
import pl.myproject.kanbanproject2.dto.ColumnDTO;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.model.Task;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class ColumnMapper implements Function<Column, ColumnDTO> {

    private final TaskMapper taskMapper;

    public ColumnMapper(TaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @Override
    public ColumnDTO apply(Column column) {
        if (column == null) {
            return null;
        }

        List<TaskDTO> taskDTOs = column.getTasks().stream()
                .map(taskMapper::apply)
                .collect(Collectors.toList());

        return new ColumnDTO(
                column.getId(),
                column.getName(),
                column.getPosition(),
                column.getWipLimit(),
                taskDTOs
        );
    }
}
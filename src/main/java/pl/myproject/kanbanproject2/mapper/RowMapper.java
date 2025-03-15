package pl.myproject.kanbanproject2.mapper;

import org.springframework.stereotype.Component;
import pl.myproject.kanbanproject2.dto.ColumnDTO;
import pl.myproject.kanbanproject2.dto.RowDTO;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.model.Row;
import pl.myproject.kanbanproject2.model.Task;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class RowMapper implements Function<Row, RowDTO> {

    private final TaskMapper taskMapper;

    public RowMapper(TaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @Override
    public RowDTO apply(Row row) {
        if (row == null) {
            return null;
        }

        List<TaskDTO> taskDTOs = row.getTasks().stream()
                .map(taskMapper::apply) // Używamy TaskMapper do mapowania każdego Task na TaskDTO
                .collect(Collectors.toList());

        return new RowDTO(
                row.getId(),
                row.getName(),
                row.getWipLimit(),
                taskDTOs
        );
    }
}

package pl.myproject.kanbanproject2.mapper;

import org.springframework.stereotype.Component;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Task;

import java.util.function.Function;
@Component
public class TaskMapper implements Function<Task, TaskDTO> {
    @Override
    public TaskDTO apply(Task task) {
        if(task == null) {
            return null;
        }

        Integer columnId = null;
        if (task.getColumn() != null) {
            columnId = task.getColumn().getId();
        }

        return new TaskDTO(
                task.getId(),
                task.getTitle(),
                columnId);
    }
}
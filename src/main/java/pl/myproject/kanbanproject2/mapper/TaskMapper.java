package pl.myproject.kanbanproject2.mapper;

import org.springframework.stereotype.Component;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;

import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class TaskMapper implements Function<Task, TaskDTO> {

    @Override
    public TaskDTO apply(Task task) {
        if (task == null) {
            return null;
        }

        Integer columnId = null;
        if (task.getColumn() != null) {
            columnId = task.getColumn().getId();
        }

        Set<Integer> userIds = null;
        if (task.getUsers() != null) {
            userIds = task.getUsers().stream()
                    .map(User::getId)
                    .collect(java.util.stream.Collectors.toSet());
        }

        return new TaskDTO(
                task.getId(),
                task.getTitle(),
                columnId,
                userIds
        );
    }
}

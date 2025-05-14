package pl.myproject.kanbanproject2.mapper;

import org.springframework.stereotype.Component;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
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

        Integer rowId = null;
        if (task.getRow() != null) {
            rowId = task.getRow().getId();
        }

        Set<Integer> userIds = null;
        if (task.getUsers() != null) {
            userIds = task.getUsers().stream()
                    .map(User::getId)
                    .collect(Collectors.toSet());
        }

        Integer parentTaskId = null;
        if (task.getParentTask() != null) {
            parentTaskId = task.getParentTask().getId();
        }

        Set<Integer> childTaskIds = null;
        if (task.getChildTasks() != null && !task.getChildTasks().isEmpty()) {
            childTaskIds = task.getChildTasks().stream()
                    .map(Task::getId)
                    .collect(Collectors.toSet());
        }

        Set<String> labels = task.getLabels();

        // Pobierz historię kolumn lub utwórz pustą listę jeśli jest null
        List<String> columnHistory = task.getColumnHistory();
        if (columnHistory == null) {
            columnHistory = new ArrayList<>();
        }

        return new TaskDTO(
                task.getId(),
                task.getTitle(),
                task.getPosition(),
                columnId,
                rowId,
                userIds,
                labels,
                task.isCompleted(),
                task.getDescription(),
                parentTaskId,
                childTaskIds,
                task.getDeadline(),
                task.isExpired(),
                columnHistory
        );
    }
}
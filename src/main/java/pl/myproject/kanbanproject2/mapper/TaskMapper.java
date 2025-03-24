package pl.myproject.kanbanproject2.mapper;
import org.springframework.stereotype.Component;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class TaskMapper implements Function<Task, TaskDTO> {

    public TaskDTO apply(Task task) {
        return apply(task, true);
    }

    public TaskDTO apply(Task task, boolean includeChildTasks) {
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
                    .collect(java.util.stream.Collectors.toSet());
        }

        List<String> labels = task.getLabels();

        Integer parentTaskId = task.getParentTask() != null ? task.getParentTask().getId() : null;
        List<Integer> childTaskIds = task.getChildTasks().stream()
                .map(Task::getId)
                .collect(Collectors.toList());

        // Map child tasks recursively, but prevent infinite recursion
        List<TaskDTO> childTaskDTOs = Collections.emptyList();
        if (includeChildTasks && task.getChildTasks() != null) {
            childTaskDTOs = task.getChildTasks().stream()
                    .map(childTask -> apply(childTask, false)) // Don't recurse into grandchildren
                    .collect(Collectors.toList());
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
                childTaskDTOs
        );
    }
}
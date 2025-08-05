package pl.myproject.kanbanproject2.task.subtask;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.myproject.kanbanproject2.exception.ExceptionIdentifier;
import pl.myproject.kanbanproject2.exception.GlobalException;
import pl.myproject.kanbanproject2.task.Task;
import pl.myproject.kanbanproject2.task.TaskRepository;

import java.util.List;

@RequiredArgsConstructor
@Transactional
@Service
public class SubTaskService {

    private final SubTaskRepository subTaskRepository;
    private final TaskRepository taskRepository;
    private final SubTaskMapper subTaskMapper;

    public SubTaskDto addSubTask(SubTask subTask) {
        if (subTask.getPosition() == null) {
            subTask.setPosition((int) subTaskRepository.count() + 1);
        }
        return subTaskMapper.toDto(subTaskRepository.save(subTask));
    }

    public List<SubTaskDto> getAllSubTasks() {
        return subTaskRepository.findAll().stream().map(subTaskMapper::toDto).toList();
    }

    public void deleteSubTask(Integer id) {
        if (!subTaskRepository.existsById(id)) {
            throw subTaskNotFound(id);
        }
        subTaskRepository.deleteById(id);
    }

    public SubTaskDto getSubTaskById(Integer id) {
        return subTaskRepository.findById(id).map(subTaskMapper::toDto)
                .orElseThrow(() -> subTaskNotFound(id));
    }

    public SubTaskDto patchSubTask(Integer id, SubTask subTask) {
        var existingSubTask = findSubTask(id);

        if (subTask.getTitle() != null) {
            existingSubTask.setTitle(subTask.getTitle());
        }
        if (subTask.getDescription() != null) {
            existingSubTask.setDescription(subTask.getDescription());
        }
        existingSubTask.setCompleted(subTask.isCompleted());
        if (subTask.getTask() != null) {
            existingSubTask.setTask(subTask.getTask());
        }
        if (subTask.getPosition() != null) {
            existingSubTask.setPosition(subTask.getPosition());
        }

        return subTaskMapper.toDto(subTaskRepository.save(existingSubTask));
    }

    public SubTaskDto assignTaskToSubTask(Integer subTaskId, Integer taskId) {
        var subTask = findSubTask(subTaskId);
        var task = taskRepository.findById(taskId)
                .orElseThrow(() -> new GlobalException(ExceptionIdentifier.TASK_NOT_FOUND,
                        "Task not found with id: " + taskId));

        subTask.setTask(task);
        task.getSubTasks().add(subTask);

        taskRepository.save(task);
        return subTaskMapper.toDto(subTaskRepository.save(subTask));
    }

    public List<SubTaskDto> getSubTasksByTaskId(Integer taskId) {
        var task = taskRepository.findById(taskId)
                .orElseThrow(() -> new GlobalException(ExceptionIdentifier.TASK_NOT_FOUND,
                        "Task not found with id: " + taskId));
        return task.getSubTasks().stream().map(subTaskMapper::toDto).toList();
    }

    public SubTaskDto toggleSubTaskCompletion(Integer id) {
        var subTask = findSubTask(id);
        subTask.setCompleted(!subTask.isCompleted());
        return subTaskMapper.toDto(subTaskRepository.save(subTask));
    }

    public SubTaskDto updateSubTaskPosition(Integer id, Integer position) {
        var subTask = findSubTask(id);
        subTask.setPosition(position);
        return subTaskMapper.toDto(subTaskRepository.save(subTask));
    }

    private SubTask findSubTask(Integer id) {
        return subTaskRepository.findById(id).orElseThrow(() -> subTaskNotFound(id));
    }

    private GlobalException subTaskNotFound(Integer id) {
        return new GlobalException(ExceptionIdentifier.SUBTASK_NOT_FOUND,
                "Subtask not found with id: " + id);
    }
}

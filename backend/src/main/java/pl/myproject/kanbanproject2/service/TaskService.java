package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.mapper.TaskMapper;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.TaskRepository;
import pl.myproject.kanbanproject2.repository.UserRepository;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Transactional
@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;
    private final UserService userService;

    @Autowired
    public TaskService(TaskRepository taskRepository, UserRepository userRepository, TaskMapper taskMapper, UserService userService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.taskMapper = taskMapper;
        this.userService = userService;
    }

    public Task addTask(Task task) {
        // If position is not set, set it to the last position + 1
        if (task.getPosition() == null) {
            long count = taskRepository.count();
            task.setPosition((int) count + 1);
        }

        // Initialize labels if null
        if (task.getLabels() == null) {
            task.setLabels(new HashSet<>());
        }

        return taskRepository.save(task);
    }

    public List<TaskDTO> getAllTasks() {
        List<TaskDTO> taskDTOS = taskRepository.findAll().stream()
                .map(taskMapper::apply)
                .sorted(Comparator.comparing(TaskDTO::position))
                .collect(Collectors.toList());
        return taskDTOS;
    }

    public void deleteTask(Integer id) {
        if (!taskRepository.existsById(id)) {
            throw new EntityNotFoundException("Nie ma zadania o takim id");
        }
        taskRepository.deleteById(id);
    }

    public TaskDTO getTaskById(Integer id) {
        return taskRepository.findById(id)
                .map(taskMapper::apply)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));
    }

    public TaskDTO patchTask(Integer id, Task task) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

        if (task.getTitle() != null) {
            existingTask.setTitle(task.getTitle());
        }
        if (task.getColumn() != null) {
            existingTask.setColumn(task.getColumn());
        }
        if (task.getUsers() != null) {
            existingTask.setUsers(task.getUsers());
        }
        if (task.getPosition() != null) {
            existingTask.setPosition(task.getPosition());
        }
        if (task.getRow() != null) {
            existingTask.setRow(task.getRow());
        }
        if (task.getLabels() != null) {
            existingTask.setLabels(task.getLabels());
        }
        if (task.getDescription() != null) {
            existingTask.setDescription(task.getDescription());
        }
        if (task.getPosition() != null) {
            existingTask.setPosition(task.getPosition());
        }


        Task savedTask = taskRepository.save(existingTask);
        return taskMapper.apply(savedTask);
    }

    public TaskDTO assignUserToTask(Integer taskId, Integer userId) {
        boolean isWithinLimit = userService.checkWipStatus(userId);

        if (!isWithinLimit) {
            throw new RuntimeException("Nie można przypisać użytkownika.");
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma użytkownika o takim id"));

        task.getUsers().add(user);
        user.getTasks().add(task);

        userRepository.save(user);
        Task updatedTask = taskRepository.save(task);

        return taskMapper.apply(updatedTask);
    }

    public TaskDTO removeUserFromTask(Integer taskId, Integer userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma użytkownika o takim id"));

        task.getUsers().remove(user);
        user.getTasks().remove(task);

        userRepository.save(user);
        Task updatedTask = taskRepository.save(task);

        return taskMapper.apply(updatedTask);
    }

    public TaskDTO updateTaskPosition(Integer id, Integer position) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));
        task.setPosition(position);
        Task updatedTask = taskRepository.save(task);
        return taskMapper.apply(updatedTask);
    }

    public TaskDTO addLabelToTask(Integer taskId, String label) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

        if (task.getLabels() == null) {
            task.setLabels(new HashSet<>());
        }

        task.getLabels().add(label);
        Task updatedTask = taskRepository.save(task);
        return taskMapper.apply(updatedTask);
    }

    public TaskDTO removeLabelFromTask(Integer taskId, String label) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

        if (task.getLabels() != null) {
            task.getLabels().remove(label);
            Task updatedTask = taskRepository.save(task);
            return taskMapper.apply(updatedTask);
        }

        return taskMapper.apply(task);
    }

    public TaskDTO updateTaskLabels(Integer taskId, Set<String> labels) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma zadania o takim id"));

        task.setLabels(labels);
        Task updatedTask = taskRepository.save(task);
        return taskMapper.apply(updatedTask);
    }


    public Set<String> getAllLabels() {
        try {
            List<Task> allTasks = taskRepository.findAll();
            return allTasks.stream()
                    .filter(task -> task.getLabels() != null)
                    .flatMap(task -> task.getLabels().stream())
                    .collect(Collectors.toSet());
        } catch (Exception e) {

            return new HashSet<>();

        }
    }
}
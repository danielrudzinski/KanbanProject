package pl.myproject.kanbanproject2.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponents;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.mapper.TaskMapper;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.TaskRepository;
import pl.myproject.kanbanproject2.repository.UserRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository; // Dodano repozytorium użytkowników
    private final TaskMapper taskMapper;

    @Autowired
    public TaskService(TaskRepository taskRepository, UserRepository userRepository, TaskMapper taskMapper) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository; // Inicjalizacja repozytorium użytkowników
        this.taskMapper = taskMapper;
    }

    public ResponseEntity<Task> addTask(Task task) {
        Task savedTask = taskRepository.save(task);
        UriComponents uriComponents = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(savedTask.getId());
        return ResponseEntity.created(uriComponents.toUri()).body(savedTask);
    }

    public ResponseEntity<List<TaskDTO>> getAllTasks() {
        List<TaskDTO> taskDTOS = StreamSupport.stream(taskRepository.findAll().spliterator(), false)
                .map(taskMapper)
                .collect(Collectors.toList());
        return ResponseEntity.ok(taskDTOS);
    }

    public ResponseEntity<Void> deleteTask(Integer id) {
        if (!taskRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        taskRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    public ResponseEntity<TaskDTO> getTaskById(Integer id) {
        return taskRepository.findById(id)
                .map(taskMapper)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public ResponseEntity<TaskDTO> patchTask(Integer id, Task task) {
        return taskRepository.findById(id)
                .map(existingTask -> {
                    if (task.getTitle() != null) {
                        existingTask.setTitle(task.getTitle());
                    }
                    if (task.getColumn() != null) {
                        existingTask.setColumn(task.getColumn());
                    }
                    if (task.getUsers() != null) {
                        existingTask.setUsers(task.getUsers());
                    }
                    Task savedTask = taskRepository.save(existingTask);
                    return taskMapper.apply(savedTask);
                })
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public ResponseEntity<TaskDTO> assignUserToTask(Integer taskId, Integer userId) {
        Optional<Task> optionalTask = taskRepository.findById(taskId);
        if (optionalTask.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = optionalTask.get();
        User user = optionalUser.get();

        // Update both sides of the relationship
        task.getUsers().add(user);
        user.getTasks().add(task);

        // Save both entities
        userRepository.save(user);
        Task updatedTask = taskRepository.save(task);

        // Convert to DTO and return
        TaskDTO taskDTO = taskMapper.apply(updatedTask);

        return ResponseEntity.ok(taskDTO);
    }

}

package pl.myproject.kanbanproject2.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.service.TaskService;

import java.util.List;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskService taskService;

    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskDTO>> getAllTasks() {
        return taskService.getAllTasks();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Integer id) {
        return taskService.deleteTask(id);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Integer id) {
        return taskService.getTaskById(id);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TaskDTO> patchTask(@PathVariable Integer id, @RequestBody Task task) {
        return taskService.patchTask(id, task);
    }

    @PostMapping()
    public ResponseEntity<TaskDTO> createTask(@RequestBody Task task) {
        return taskService.addTask(task);
    }

    @PutMapping("/{taskId}/user/{userId}")
    public ResponseEntity<TaskDTO> assignUserToTask(@PathVariable Integer taskId, @PathVariable Integer userId) {
        return taskService.assignUserToTask(taskId, userId);
    }

}

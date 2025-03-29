package pl.myproject.kanbanproject2.controller;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.service.TaskService;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Integer id) {
        try {
            taskService.deleteTask(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(taskService.getTaskById(id));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TaskDTO> patchTask(@PathVariable Integer id, @RequestBody Task task) {
        try {
            return ResponseEntity.ok(taskService.patchTask(id, task));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        return ResponseEntity.ok(taskService.addTask(task));
    }

    @PutMapping("/{taskId}/user/{userId}")
    public ResponseEntity<TaskDTO> assignUserToTask(@PathVariable Integer taskId, @PathVariable Integer userId) {
        try {
            return ResponseEntity.ok(taskService.assignUserToTask(taskId, userId));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{taskId}/user/{userId}")
    public ResponseEntity<TaskDTO> removeUserFromTask(@PathVariable Integer taskId, @PathVariable Integer userId) {
        try {
            return ResponseEntity.ok(taskService.removeUserFromTask(taskId, userId));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/position/{position}")
    public ResponseEntity<TaskDTO> updateTaskPosition(
            @PathVariable Integer id,
            @PathVariable Integer position) {
        try {
            return ResponseEntity.ok(taskService.updateTaskPosition(id, position));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{taskId}/label/{label}")
    public ResponseEntity<TaskDTO> addLabelToTask(@PathVariable Integer taskId, @PathVariable String label) {
        try {
            return ResponseEntity.ok(taskService.addLabelToTask(taskId, label));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{taskId}/label/{label}")
    public ResponseEntity<TaskDTO> removeLabelFromTask(@PathVariable Integer taskId, @PathVariable String label) {
        try {
            return ResponseEntity.ok(taskService.removeLabelFromTask(taskId, label));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{taskId}/labels")
    public ResponseEntity<TaskDTO> updateTaskLabels(
            @PathVariable Integer taskId,
            @RequestBody Set<String> labels) {
        try {
            return ResponseEntity.ok(taskService.updateTaskLabels(taskId, labels));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }

    }
    @GetMapping("/get/all/labels")
    public ResponseEntity<Set<String>> getAllLabels() {
        Set<String> labels = taskService.getAllLabels();
        return ResponseEntity.ok(labels);
    }
}
package pl.myproject.kanbanproject2.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.service.TaskService;

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
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Integer id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TaskDTO> patchTask(@PathVariable Integer id, @RequestBody Task task) {
        return ResponseEntity.ok(taskService.patchTask(id, task));
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        return ResponseEntity.ok(taskService.addTask(task));
    }

    @PutMapping("/{taskId}/user/{userId}")
    public ResponseEntity<TaskDTO> assignUserToTask(@PathVariable Integer taskId, @PathVariable Integer userId) {
        return ResponseEntity.ok(taskService.assignUserToTask(taskId, userId));
    }

    @DeleteMapping("/{taskId}/user/{userId}")
    public ResponseEntity<TaskDTO> removeUserFromTask(@PathVariable Integer taskId, @PathVariable Integer userId) {
        return ResponseEntity.ok(taskService.removeUserFromTask(taskId, userId));
    }

    @PatchMapping("/{id}/position/{position}")
    public ResponseEntity<TaskDTO> updateTaskPosition(
            @PathVariable Integer id,
            @PathVariable Integer position) {
        return ResponseEntity.ok(taskService.updateTaskPosition(id, position));
    }

    @PutMapping("/{taskId}/label/{label}")
    public ResponseEntity<TaskDTO> addLabelToTask(@PathVariable Integer taskId, @PathVariable String label) {
        return ResponseEntity.ok(taskService.addLabelToTask(taskId, label));
    }

    @DeleteMapping("/{taskId}/label/{label}")
    public ResponseEntity<TaskDTO> removeLabelFromTask(@PathVariable Integer taskId, @PathVariable String label) {
        return ResponseEntity.ok(taskService.removeLabelFromTask(taskId, label));
    }

    @PatchMapping("/{taskId}/labels")
    public ResponseEntity<TaskDTO> updateTaskLabels(
            @PathVariable Integer taskId,
            @RequestBody Set<String> labels) {
        return ResponseEntity.ok(taskService.updateTaskLabels(taskId, labels));
    }

    @GetMapping("/get/all/labels")
    public ResponseEntity<Set<String>> getAllLabels() {
        Set<String> labels = taskService.getAllLabels();
        return ResponseEntity.ok(labels);
    }
}
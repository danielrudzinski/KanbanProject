package pl.myproject.kanbanproject2.task;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;


    @GetMapping
    public ResponseEntity<List<TaskDto>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Integer id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDto> getTaskById(@PathVariable Integer id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TaskDto> patchTask(@PathVariable Integer id, @RequestBody Task task) {
        return ResponseEntity.ok(taskService.patchTask(id, task));
    }

    @PostMapping
    public ResponseEntity<TaskDto> createTask(@RequestBody Task task) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.addTask(task));
    }

    @PutMapping("/{taskId}/user/{userId}")
    public ResponseEntity<TaskDto> assignUserToTask(@PathVariable Integer taskId, @PathVariable Integer userId) {
        return ResponseEntity.ok(taskService.assignUserToTask(taskId, userId));
    }

    @DeleteMapping("/{taskId}/user/{userId}")
    public ResponseEntity<TaskDto> removeUserFromTask(@PathVariable Integer taskId, @PathVariable Integer userId) {
        return ResponseEntity.ok(taskService.removeUserFromTask(taskId, userId));
    }

    @PatchMapping("/{id}/position/{position}")
    public ResponseEntity<TaskDto> updateTaskPosition(
            @PathVariable Integer id,
            @PathVariable Integer position) {
        return ResponseEntity.ok(taskService.updateTaskPosition(id, position));
    }

    @PutMapping("/{taskId}/label/{label}")
    public ResponseEntity<TaskDto> addLabelToTask(@PathVariable Integer taskId, @PathVariable String label) {
        return ResponseEntity.ok(taskService.addLabelToTask(taskId, label));
    }

    @DeleteMapping("/{taskId}/label/{label}")
    public ResponseEntity<TaskDto> removeLabelFromTask(@PathVariable Integer taskId, @PathVariable String label) {
        return ResponseEntity.ok(taskService.removeLabelFromTask(taskId, label));
    }

    @PatchMapping("/{taskId}/labels")
    public ResponseEntity<TaskDto> updateTaskLabels(
            @PathVariable Integer taskId,
            @RequestBody Set<String> labels) {
        return ResponseEntity.ok(taskService.updateTaskLabels(taskId, labels));
    }

    @GetMapping("/get/all/labels")
    public ResponseEntity<Set<String>> getAllLabels() {
        Set<String> labels = taskService.getAllLabels();
        return ResponseEntity.ok(labels);
    }

    @PutMapping("/{childTaskId}/parent/{parentTaskId}")
    public ResponseEntity<TaskDto> assignParentTask(@PathVariable Integer childTaskId, @PathVariable Integer parentTaskId) {
        return ResponseEntity.ok(taskService.assignParentTask(childTaskId, parentTaskId));
    }

    @DeleteMapping("/{childTaskId}/parent")
    public ResponseEntity<TaskDto> removeParentTask(@PathVariable Integer childTaskId) {
        return ResponseEntity.ok(taskService.removeParentTask(childTaskId));
    }

    @GetMapping("/{taskId}/children")
    public ResponseEntity<List<TaskDto>> getChildTasks(@PathVariable Integer taskId) {
        return ResponseEntity.ok(taskService.getChildTasks(taskId));
    }

    @GetMapping("/{taskId}/parent")
    public ResponseEntity<TaskDto> getParentTask(@PathVariable Integer taskId) {
        return ResponseEntity.ok(taskService.getParentTask(taskId));
    }

    @PatchMapping("/{taskId}/complete/{status}")
    public ResponseEntity<TaskDto> updateTaskCompletion(@PathVariable Integer taskId, @PathVariable boolean status) {
        return ResponseEntity.ok(taskService.updateTaskCompletion(taskId, status));
    }

    @GetMapping("/{taskId}/can-complete")
    public ResponseEntity<Boolean> canTaskBeCompleted(@PathVariable Integer taskId) {
        return ResponseEntity.ok(taskService.canTaskBeCompleted(taskId));
    }

    @GetMapping("/daily-focus")
    public ResponseEntity<List<TaskDto>> getDailyFocusTasks() {
        return ResponseEntity.ok(taskService.getDailyFocusTasks());
    }

    @PatchMapping("/{taskId}/daily-focus/{status}")
    public ResponseEntity<TaskDto> setDailyFocus(@PathVariable Integer taskId, @PathVariable boolean status) {
        return ResponseEntity.ok(taskService.setDailyFocus(taskId, status));
    }

}
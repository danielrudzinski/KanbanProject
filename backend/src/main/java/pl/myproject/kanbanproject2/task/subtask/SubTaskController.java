package pl.myproject.kanbanproject2.task.subtask;

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

@RestController
@RequestMapping("/subtasks")
@RequiredArgsConstructor
public class SubTaskController {

    private final SubTaskService subTaskService;


    @GetMapping
    public ResponseEntity<List<SubTaskDto>> getAllSubTasks() {
        return ResponseEntity.ok(subTaskService.getAllSubTasks());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubTask(@PathVariable Integer id) {
        subTaskService.deleteSubTask(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubTaskDto> getSubTaskById(@PathVariable Integer id) {
        return ResponseEntity.ok(subTaskService.getSubTaskById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SubTaskDto> patchSubTask(@PathVariable Integer id, @RequestBody SubTask subTask) {
        return ResponseEntity.ok(subTaskService.patchSubTask(id, subTask));
    }

    @PostMapping
    public ResponseEntity<SubTaskDto> createSubTask(@RequestBody SubTask subTask) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subTaskService.addSubTask(subTask));
    }

    @PutMapping("/{subTaskId}/task/{taskId}")
    public ResponseEntity<SubTaskDto> assignTaskToSubTask(@PathVariable Integer subTaskId, @PathVariable Integer taskId) {
        return ResponseEntity.ok(subTaskService.assignTaskToSubTask(subTaskId, taskId));
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<SubTaskDto>> getSubTasksByTaskId(@PathVariable Integer taskId) {
        return ResponseEntity.ok(subTaskService.getSubTasksByTaskId(taskId));
    }

    @PatchMapping("/{id}/change")
    public ResponseEntity<SubTaskDto> toggleSubTaskCompletion(@PathVariable Integer id) {
        return ResponseEntity.ok(subTaskService.toggleSubTaskCompletion(id));
    }

    @PatchMapping("/{id}/position/{position}")
    public ResponseEntity<SubTaskDto> updateSubTaskPosition(@PathVariable Integer id, @PathVariable Integer position) {
        return ResponseEntity.ok(subTaskService.updateSubTaskPosition(id, position));
    }
}
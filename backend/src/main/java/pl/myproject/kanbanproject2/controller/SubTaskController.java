package pl.myproject.kanbanproject2.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.dto.SubTaskDTO;
import pl.myproject.kanbanproject2.model.SubTask;
import pl.myproject.kanbanproject2.service.SubTaskService;

import java.util.List;

@RestController
@RequestMapping("/subtasks")
public class SubTaskController {

    private final SubTaskService subTaskService;

    @Autowired
    public SubTaskController(SubTaskService subTaskService) {
        this.subTaskService = subTaskService;
    }

    @GetMapping
    public ResponseEntity<List<SubTaskDTO>> getAllSubTasks() {
        return ResponseEntity.ok(subTaskService.getAllSubTasks());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubTask(@PathVariable Integer id) {
        subTaskService.deleteSubTask(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubTaskDTO> getSubTaskById(@PathVariable Integer id) {
        return ResponseEntity.ok(subTaskService.getSubTaskById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SubTaskDTO> patchSubTask(@PathVariable Integer id, @RequestBody SubTask subTask) {
        return ResponseEntity.ok(subTaskService.patchSubTask(id, subTask));
    }

    @PostMapping
    public ResponseEntity<SubTask> createSubTask(@RequestBody SubTask subTask) {
        return ResponseEntity.ok(subTaskService.addSubTask(subTask));
    }

    @PutMapping("/{subTaskId}/task/{taskId}")
    public ResponseEntity<SubTaskDTO> assignTaskToSubTask(@PathVariable Integer subTaskId, @PathVariable Integer taskId) {
        return ResponseEntity.ok(subTaskService.assignTaskToSubTask(subTaskId, taskId));
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<SubTaskDTO>> getSubTasksByTaskId(@PathVariable Integer taskId) {
        return ResponseEntity.ok(subTaskService.getSubTasksByTaskId(taskId));
    }

    @PatchMapping("/{id}/change")
    public ResponseEntity<SubTaskDTO> toggleSubTaskCompletion(@PathVariable Integer id) {
        return ResponseEntity.ok(subTaskService.toggleSubTaskCompletion(id));
    }

    @PatchMapping("/{id}/position/{position}")
    public ResponseEntity<SubTaskDTO> updateSubTaskPosition(@PathVariable Integer id, @PathVariable Integer position) {
        return ResponseEntity.ok(subTaskService.updateSubTaskPosition(id, position));
    }
}
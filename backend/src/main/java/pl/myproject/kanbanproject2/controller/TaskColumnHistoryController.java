
package pl.myproject.kanbanproject2.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.dto.TaskColumnHistoryDTO;
import pl.myproject.kanbanproject2.service.TaskService;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskColumnHistoryController {

    private final TaskService taskService;

    @Autowired
    public TaskColumnHistoryController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/{taskId}/column-history")
    public ResponseEntity<List<TaskColumnHistoryDTO>> getTaskColumnHistory(@PathVariable Integer taskId) {
        return ResponseEntity.ok(taskService.getTaskColumnHistoryDTOs(taskId));
    }
}
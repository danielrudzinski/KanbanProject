
package pl.myproject.kanbanproject2.task.history;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.myproject.kanbanproject2.task.TaskService;

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
    public ResponseEntity<List<TaskColumnHistoryDto>> getTaskColumnHistory(@PathVariable Integer taskId) {
        return ResponseEntity.ok(taskService.getTaskColumnHistoryDTOs(taskId));
    }
}
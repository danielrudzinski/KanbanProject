package pl.myproject.kanbanproject2.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.dto.TaskColumnHistoryDTO;
import pl.myproject.kanbanproject2.mapper.TaskColumnHistoryMapper;
import pl.myproject.kanbanproject2.model.TaskColumnHistory;
import pl.myproject.kanbanproject2.service.TaskService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tasks")
public class TaskColumnHistoryController {

    private final TaskService taskService;
    private final TaskColumnHistoryMapper historyMapper;

    @Autowired
    public TaskColumnHistoryController(TaskService taskService, TaskColumnHistoryMapper historyMapper) {
        this.taskService = taskService;
        this.historyMapper = historyMapper;
    }

    @GetMapping("/{taskId}/column-history")
    public ResponseEntity<List<TaskColumnHistoryDTO>> getTaskColumnHistory(@PathVariable Integer taskId) {
        List<TaskColumnHistory> history = taskService.getTaskColumnHistory(taskId);
        List<TaskColumnHistoryDTO> historyDTOs = history.stream()
                .map(historyMapper::toDTO)
                .collect(Collectors.toList());
        return new ResponseEntity<>(historyDTOs, HttpStatus.OK);
    }
}
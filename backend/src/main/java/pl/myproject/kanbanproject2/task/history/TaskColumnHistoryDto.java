package pl.myproject.kanbanproject2.task.history;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskColumnHistoryDto {
    private Integer id;
    private Integer taskId;
    private String taskTitle;
    private Integer columnId;
    private String columnName;
    private LocalDateTime changedAt;
}
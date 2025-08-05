package pl.myproject.kanbanproject2.task.history;

import org.springframework.stereotype.Component;

@Component
public class TaskColumnHistoryMapper {
    public TaskColumnHistoryDto toDTO(TaskColumnHistory history) {
        TaskColumnHistoryDto dto = new TaskColumnHistoryDto();
        dto.setId(history.getId());
        dto.setTaskId(history.getTask().getId());
        dto.setTaskTitle(history.getTask().getTitle());
        dto.setColumnId(history.getColumn().getId());
        dto.setColumnName(history.getColumnName());
        dto.setChangedAt(history.getChangedAt());
        return dto;
    }
}
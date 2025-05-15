package pl.myproject.kanbanproject2.mapper;

import org.springframework.stereotype.Component;
import pl.myproject.kanbanproject2.dto.TaskColumnHistoryDTO;
import pl.myproject.kanbanproject2.model.TaskColumnHistory;

@Component
public class TaskColumnHistoryMapper {
    public TaskColumnHistoryDTO toDTO(TaskColumnHistory history) {
        TaskColumnHistoryDTO dto = new TaskColumnHistoryDTO();
        dto.setId(history.getId());
        dto.setTaskId(history.getTask().getId());
        dto.setTaskTitle(history.getTask().getTitle());
        dto.setColumnId(history.getColumn().getId());
        dto.setColumnName(history.getColumnName());
        dto.setChangedAt(history.getChangedAt());
        return dto;
    }
}
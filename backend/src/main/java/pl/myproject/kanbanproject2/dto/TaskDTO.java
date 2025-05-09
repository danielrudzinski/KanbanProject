package pl.myproject.kanbanproject2.dto;

import java.time.LocalDateTime;
import java.util.Set;

public record TaskDTO(
        Integer id,
        String title,
        Integer position,
        Integer columnId,
        Integer rowId,
        Set<Integer> userIds,
        Set<String> labels,
        boolean completed,
        String description,
        Integer parentTaskId,
        Set<Integer> childTaskIds,
        LocalDateTime deadline,
        boolean expired
) {}
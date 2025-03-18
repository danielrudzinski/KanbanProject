package pl.myproject.kanbanproject2.dto;

import java.util.List;
import java.util.Set;

public record TaskDTO(Integer id, String title, Integer position, Integer columnId, Integer rowId, Set<Integer> userIds,
                      List<String> labels) {
}

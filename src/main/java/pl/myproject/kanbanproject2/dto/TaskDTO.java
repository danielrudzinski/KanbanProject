package pl.myproject.kanbanproject2.dto;

import java.util.Set;

public record TaskDTO(Integer id, String title, Integer columnId, Set<Integer> userIds) {
}

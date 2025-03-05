package pl.myproject.kanbanproject2.dto;

import pl.myproject.kanbanproject2.model.Column;

public record TaskDTO(Integer id, String title, Integer columnId) {
}
package pl.myproject.kanbanproject2.dto;

import java.util.List;

public record UserDTO(Integer id, String email, String name, List<TaskDTO> tasks) {
}

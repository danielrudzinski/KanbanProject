package pl.myproject.kanbanproject2.dto;

import java.util.Set;

public record UserDTO(Integer id, String email, String name, Set<TaskDTO> tasks) {}

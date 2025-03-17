package pl.myproject.kanbanproject2.dto;

public record ColumnDTO(Integer id, String name, Integer position, Integer wipLimit, java.util.List<TaskDTO> taskDTO) {
}
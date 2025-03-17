package pl.myproject.kanbanproject2.mapper;

import org.springframework.stereotype.Component;
import pl.myproject.kanbanproject2.dto.SubTaskDTO;
import pl.myproject.kanbanproject2.model.SubTask;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class SubTaskMapper {

    private final TaskRepository taskRepository;

    @Autowired
    public SubTaskMapper(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public SubTaskDTO toDto(SubTask entity) {
        if (entity == null) {
            return null;
        }

        return new SubTaskDTO(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.isCompleted(),
                entity.getPosition(),
                entity.getTask() != null ? entity.getTask().getId() : null
        );
    }

    public List<SubTaskDTO> toDtoList(List<SubTask> entities) {
        if (entities == null) {
            return List.of();
        }

        return entities.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public SubTask toEntity(SubTaskDTO dto) {
        if (dto == null) {
            return null;
        }

        SubTask entity = new SubTask();
        entity.setId(dto.id());
        entity.setTitle(dto.title());
        entity.setDescription(dto.description());
        entity.setCompleted(dto.completed());
        entity.setPosition(dto.position());

        // Ustawienie relacji z Task, jeśli taskId jest dostępne
        if (dto.taskId() != null) {
            Task task = taskRepository.findById(dto.taskId())
                    .orElse(null);
            entity.setTask(task);
        }

        return entity;
    }

    public List<SubTask> toEntityList(List<SubTaskDTO> dtos) {
        if (dtos == null) {
            return List.of();
        }

        return dtos.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }

    // Metoda pomocnicza do aktualizacji istniejącej encji na podstawie DTO
    public void updateEntityFromDto(SubTaskDTO dto, SubTask entity) {
        if (dto == null || entity == null) {
            return;
        }

        entity.setTitle(dto.title());
        entity.setDescription(dto.description());
        entity.setCompleted(dto.completed());

        if (dto.position() != null) {
            entity.setPosition(dto.position());
        }

        // Aktualizacja relacji, jeśli taskId się zmienił
        if (dto.taskId() != null &&
                (entity.getTask() == null || !dto.taskId().equals(entity.getTask().getId()))) {
            Task task = taskRepository.findById(dto.taskId())
                    .orElse(null);
            entity.setTask(task);
        }
    }
}
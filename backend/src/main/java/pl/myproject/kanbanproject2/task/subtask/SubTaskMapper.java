package pl.myproject.kanbanproject2.task.subtask;

import org.springframework.stereotype.Component;

@Component
public class SubTaskMapper {

    public SubTaskDto toDto(SubTask entity) {
        if (entity == null) {
            return null;
        }

        return new SubTaskDto(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.isCompleted(),
                entity.getPosition(),
                entity.getTask() != null ? entity.getTask().getId() : null
        );
    }

}
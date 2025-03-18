package pl.myproject.kanbanproject2.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.myproject.kanbanproject2.model.Task;

public interface TaskRepository extends JpaRepository<Task, Integer> {
    List<Task> findByRowId(Integer rowId);
}

package pl.myproject.kanbanproject2.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.TaskColumnHistory;

import java.util.List;

@Repository
public interface TaskColumnHistoryRepository extends JpaRepository<TaskColumnHistory, Integer> {
    List<TaskColumnHistory> findByTaskOrderByChangedAtDesc(Task task);
    List<TaskColumnHistory> findByTaskIdOrderByChangedAtDesc(Integer taskId);
}
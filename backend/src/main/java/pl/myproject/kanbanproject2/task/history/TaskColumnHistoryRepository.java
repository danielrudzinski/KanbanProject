package pl.myproject.kanbanproject2.task.history;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.myproject.kanbanproject2.task.Task;

import java.util.List;

@Repository
public interface TaskColumnHistoryRepository extends JpaRepository<TaskColumnHistory, Integer> {
    List<TaskColumnHistory> findByTaskOrderByChangedAtDesc(Task task);

}
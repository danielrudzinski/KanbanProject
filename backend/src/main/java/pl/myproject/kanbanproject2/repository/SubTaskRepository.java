package pl.myproject.kanbanproject2.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.myproject.kanbanproject2.model.SubTask;

public interface SubTaskRepository extends JpaRepository<SubTask, Integer> {
}

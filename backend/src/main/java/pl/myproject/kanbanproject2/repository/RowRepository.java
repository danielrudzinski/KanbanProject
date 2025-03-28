package pl.myproject.kanbanproject2.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import pl.myproject.kanbanproject2.model.Row;

public interface RowRepository extends JpaRepository<Row, Integer> {
}

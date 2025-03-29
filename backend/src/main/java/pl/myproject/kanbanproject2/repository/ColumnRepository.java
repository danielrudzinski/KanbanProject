package pl.myproject.kanbanproject2.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.myproject.kanbanproject2.model.Column;

public interface ColumnRepository extends JpaRepository<Column, Integer> {
}

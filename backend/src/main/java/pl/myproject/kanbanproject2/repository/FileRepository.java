package pl.myproject.kanbanproject2.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.myproject.kanbanproject2.model.File;

public interface FileRepository extends JpaRepository<File, Long> {
}
package pl.myproject.kanbanproject2.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.myproject.kanbanproject2.model.Team;

public interface TeamRepository extends JpaRepository<Team, Integer> {
}

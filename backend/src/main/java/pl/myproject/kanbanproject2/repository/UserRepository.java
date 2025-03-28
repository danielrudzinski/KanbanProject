package pl.myproject.kanbanproject2.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.myproject.kanbanproject2.model.User;

public interface UserRepository extends JpaRepository<User, Integer> {
}

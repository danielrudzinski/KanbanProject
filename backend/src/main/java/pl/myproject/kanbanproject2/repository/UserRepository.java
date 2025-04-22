package pl.myproject.kanbanproject2.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.myproject.kanbanproject2.model.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByVerificationCode(String verificationCode);
    Optional<User> findByEmail(String email);
}

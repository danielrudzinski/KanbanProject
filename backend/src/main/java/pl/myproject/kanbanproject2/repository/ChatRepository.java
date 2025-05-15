package pl.myproject.kanbanproject2.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.myproject.kanbanproject2.model.Chat;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Integer> {

}
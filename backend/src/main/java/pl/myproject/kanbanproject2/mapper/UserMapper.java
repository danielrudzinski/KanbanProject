package pl.myproject.kanbanproject2.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.User;
import java.util.stream.Collectors;
import java.util.function.Function;

@Component
public class UserMapper implements Function<User, UserDTO> {

    private final TaskMapper taskMapper;

    @Autowired
    public UserMapper(TaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @Override
    public UserDTO apply(User user) {
        if (user == null) return null;

        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getTasks().stream()
                        .map(taskMapper)
                        .collect(Collectors.toSet()),
                user.getWipLimit()
        );
    }
}

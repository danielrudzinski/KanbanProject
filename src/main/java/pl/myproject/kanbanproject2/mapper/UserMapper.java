package pl.myproject.kanbanproject2.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.model.User;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class UserMapper implements Function<User, UserDTO> {

    private final TaskMapper taskMapper;

    @Autowired
    public UserMapper(TaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @Override
    public UserDTO apply(User user) {
        if (user == null) {
            return null;
        }

        List<TaskDTO> taskDTOs = null;
        if (user.getTasks() != null) {
            taskDTOs = user.getTasks().stream()
                    .map(taskMapper)
                    .collect(Collectors.toList());
        }

        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getName(),
                taskDTOs
        );
    }
}
package pl.myproject.kanbanproject2.user;

import org.springframework.stereotype.Component;
import java.util.function.Function;

@Component
public class UserMapper implements Function<User, UserDto> {

    @Override
    public UserDto apply(User user) {
        if (user == null) {
            return null;
        }

        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getWipLimit()
        );
    }
}

package pl.myproject.kanbanproject2.user;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.myproject.kanbanproject2.exception.ExceptionIdentifier;
import pl.myproject.kanbanproject2.exception.GlobalException;

import java.util.List;

@RequiredArgsConstructor
@Transactional
@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(userMapper).toList();
    }

    public UserDto getUserById(Integer id) {
        return userRepository.findById(id).map(userMapper)
                .orElseThrow(() -> userNotFound(id));
    }

    public void deleteUser(Integer id) {
        if (!userRepository.existsById(id)) {
            throw userNotFound(id);
        }
        userRepository.deleteById(id);
    }

    public UserDto patchUser(UserDto userDto, Integer id) {
        var existingUser = userRepository.findById(id).orElseThrow(() -> userNotFound(id));

        if (userDto.email() != null) {
            existingUser.setEmail(userDto.email());
        }
        if (userDto.name() != null) {
            existingUser.setName(userDto.name());
        }
        if (userDto.wipLimit() != null) {
            existingUser.setWipLimit(userDto.wipLimit());
        }
        return userMapper.apply(userRepository.save(existingUser));
    }

    public UserDto updateWipLimit(Integer userId, Integer wipLimit) {
        var user = userRepository.findById(userId).orElseThrow(() -> userNotFound(userId));
        user.setWipLimit(wipLimit);
        return userMapper.apply(userRepository.save(user));
    }

    public boolean checkWipStatus(Integer userId) {
        var user = userRepository.findById(userId).orElseThrow(() -> userNotFound(userId));
        Integer wipLimit = user.getWipLimit();
        if (wipLimit == null) {
            return true;
        }
        return user.getTasks().size() < wipLimit;
    }

    private GlobalException userNotFound(Integer id) {
        return new GlobalException(ExceptionIdentifier.USER_NOT_FOUND,
                "User not found with id: " + id);
    }
}

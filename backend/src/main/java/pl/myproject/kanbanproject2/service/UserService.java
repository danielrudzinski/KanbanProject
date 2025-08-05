package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.mapper.UserMapper;
import pl.myproject.kanbanproject2.model.File;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.FileRepository;
import pl.myproject.kanbanproject2.repository.UserRepository;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Transactional
@Service
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final FileRepository fileRepository;

    @Autowired
    public UserService(UserRepository userRepository, UserMapper userMapper, FileRepository fileRepository) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.fileRepository = fileRepository;
    }

    public List<UserDTO> getAllUsers() {
        List<UserDTO> userDTOS = userRepository.findAll().stream()
                .map(userMapper::apply)
                .collect(Collectors.toList());
        return userDTOS;
    }

    public UserDTO getUserById(Integer id) {
        try {
            return userRepository.findById(id)
                    .map(userMapper::apply)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma użytkownika o takim id"));
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public User addUser(User user) {
        return userRepository.save(user);
    }

    public void deleteUser(Integer id) {
        try {
            if (!userRepository.existsById(id)) {
                throw new EntityNotFoundException("Nie ma użytkownika o takim id");
            }
            userRepository.deleteById(id);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public User updateUser(Integer id, User user) {
        try {
            var existingUser = userRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma użytkownika o takim id"));

            if (user.getEmail() != null) {
                existingUser.setEmail(user.getEmail());
            }
            if (user.getName() != null) {
                existingUser.setName(user.getName());
            }
            if (user.getWipLimit() != null) {
                existingUser.setWipLimit(user.getWipLimit());
            }
            return userRepository.save(existingUser);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public UserDTO patchUser(UserDTO userDTO, Integer id) {
        try {
            var existingUser = userRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma użytkownika o takim id"));

            if (userDTO.email() != null) {
                existingUser.setEmail(userDTO.email());
            }
            if (userDTO.name() != null) {
                existingUser.setName(userDTO.name());
            }
            if (userDTO.wipLimit() != null) {
                existingUser.setWipLimit(userDTO.wipLimit());
            }
            var updatedUser = userRepository.save(existingUser);
            return userMapper.apply(updatedUser);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public void uploadAvatar(Integer id, MultipartFile file) {
        try {
            var user = userRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma użytkownika o takim id"));

            var avatar = new File();
            avatar.setName(file.getOriginalFilename());
            avatar.setType(file.getContentType());
            avatar.setData(file.getBytes());

            fileRepository.save(avatar);
            user.setAvatar(avatar);
            userRepository.save(user);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Błąd podczas wczytywania avatara", e);
        }
    }

    public byte[] getAvatar(Integer userId) {
        try {
            var user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma użytkownika o takim id"));

            if (user.getAvatar() == null) {
                throw new EntityNotFoundException("Użytkownik nie posiada avatara");
            }

            return user.getAvatar().getData();
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public String getAvatarContentType(Integer userId) {
        try {
            var user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma użytkownika o takim id"));

            if (user.getAvatar() == null) {
                throw new EntityNotFoundException("Użytkownik nie posiada avatara");
            }

            return user.getAvatar().getType();
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public void deleteAvatar(Integer id) {
        try {
            var user = userRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma użytkownika o takim id"));

            if (user.getAvatar() == null) {
                throw new EntityNotFoundException("Użytkownik nie posiada avatara");
            }

            var avatar = user.getAvatar();
            user.setAvatar(null);
            userRepository.save(user);
            fileRepository.delete(avatar);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public UserDTO updateWipLimit(Integer userId, Integer wipLimit) {
        try {
            var user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma użytkownika o takim id"));

            user.setWipLimit(wipLimit);
            var updatedUser = userRepository.save(user);

            return userMapper.apply(updatedUser);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    public boolean checkWipStatus(Integer userId) {
        try {
            var user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            Integer wipLimit = user.getWipLimit();
            if (wipLimit == null) {
                return true;
            }

            int activeTaskCount = user.getTasks().size();
            return activeTaskCount < wipLimit;
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

}
package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.web.ServletTestExecutionListener;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponents;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.mapper.UserMapper;
import pl.myproject.kanbanproject2.model.FileEntity;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.FileRepository;
import pl.myproject.kanbanproject2.repository.UserRepository;

import java.nio.file.attribute.UserPrincipalNotFoundException;
import java.util.*;

import org.mockito.MockedStatic;
import java.net.URI;


@ExtendWith(MockitoExtension.class)
public class UserServiceTest {


    @Mock
    private UserRepository userRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private FileRepository fileRepository;
    @InjectMocks
    private UserService userService;

    private User testUser;
    private UserDTO testUserDTO;
    private FileEntity testAvatar;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1);
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password");
        testUser.setWipLimit(5);
        testUser.setTasks(new HashSet<>());

        testAvatar = new FileEntity();
        testAvatar.setId(1L);
        testAvatar.setName("avatar.jpg");
        testAvatar.setType("image/jpeg");
        testAvatar.setData(new byte[]{1, 2, 3});
        testUser.setAvatar(testAvatar);
        testUserDTO = new UserDTO(1, "test@example.com", "Test User", new HashSet<>(), 5);
    }

    @AfterEach
    void tearDown() {
        testUser = null;
        testUserDTO = null;
    }

    @Test
    void getAllUsersShouldReturnAllUsers() {
        // given
        List<User> users = Arrays.asList(testUser);
        Mockito.when(userRepository.findAll()).thenReturn(users);
        Mockito.when(userMapper.apply(testUser)).thenReturn(testUserDTO);

        // when
        List<UserDTO> result = userService.getAllUsers();

        // then
        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals(testUserDTO, result.get(0));
        Mockito.verify(userRepository).findAll();
        Mockito.verify(userMapper).apply(testUser);
    }

    @Test
    void whenUsersAreNullGetAllUsersShouldNotGiveException() {
        // given
        List<User> users = List.of();
        Mockito.when(userRepository.findAll()).thenReturn(users);

        // when
        List<UserDTO> result = userService.getAllUsers();

        // then
        Assertions.assertTrue(result.isEmpty());
        Mockito.verify(userRepository).findAll();
        Mockito.verify(userMapper, Mockito.never()).apply(Mockito.any());
    }

    @Test
    void getUserByIdShouldReturnUser() {
        // given
        Mockito.when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        Mockito.when(userMapper.apply(testUser)).thenReturn(testUserDTO);

        // when
        UserDTO result = userService.getUserById(testUser.getId());

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testUserDTO.id(), result.id());
        Assertions.assertEquals(testUserDTO.name(), result.name());
        Assertions.assertEquals(testUserDTO.email(), result.email());
        Assertions.assertEquals(testUserDTO.wipLimit(), result.wipLimit());
        Mockito.verify(userRepository).findById(testUser.getId());
        Mockito.verify(userMapper).apply(testUser);
    }

    @Test
    void getNonExistingUserShouldNotGiveException() {
        //given
        int userId = 10;
        Mockito.when(userRepository.findById(userId)).thenReturn(Optional.empty());

        //when & then
        Assertions.assertThrows(EntityNotFoundException.class, () -> userService.getUserById(userId));
        Mockito.verify(userRepository).findById(userId);
        Mockito.verify(userMapper, Mockito.never()).apply(Mockito.any());
    }

    @Test
    void deleteUserShouldDeleteUser() {
        //given
        Mockito.when(userRepository.existsById(testUser.getId())).thenReturn(true);
        //when
        userService.deleteUser(testUser.getId());
        //then
        Mockito.verify(userRepository).existsById(testUser.getId());
        Mockito.verify(userRepository).deleteById(testUser.getId());
    }

    @Test
    void deleteNonExistingUserShouldGiveException() {
        // given
        int userId = 10;
        Mockito.when(userRepository.existsById(userId)).thenReturn(false);
        // when & then
        Assertions.assertThrows(EntityNotFoundException.class,
                () -> userService.deleteUser(userId));
        Mockito.verify(userRepository).existsById(userId);
        Mockito.verify(userRepository, Mockito.never()).deleteById(userId);

    }

    @Test
    void addUserShouldAddUser() {
        // given
        Mockito.when(userRepository.save(testUser)).thenReturn(testUser);

        // when
        User result = userService.addUser(testUser);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testUser.getId(), result.getId());
        Assertions.assertEquals(testUser.getName(), result.getName());
        Assertions.assertEquals(testUser.getEmail(), result.getEmail());
        Assertions.assertEquals(testUser.getWipLimit(), result.getWipLimit());
        Mockito.verify(userRepository).save(testUser);
    }

   


}


package pl.myproject.kanbanproject2.service;

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
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.mapper.UserMapper;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.UserRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private ServletUriComponentsBuilder servletUriComponentsBuilder;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UserDTO testUserDTO;

    @BeforeEach
    void setUp() {
        // Inicjalizacja danych testowych
        testUser = new User();
        testUser.setId(1);
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password");

        testUserDTO = new UserDTO(1, "test@example.com", "Test User", null);
    }
    @AfterEach
    void tearDown() {
        testUser = null;
        testUserDTO = null;
    }

    @Test
    void getAllUsers_shouldReturnListOfUsers() {
        // given
        List<User> users = Arrays.asList(testUser);
        Mockito.when(userRepository.findAll()).thenReturn(users);
        Mockito.when(userMapper.apply(testUser)).thenReturn(testUserDTO);

        // when
        ResponseEntity<List<UserDTO>> response = userService.getAllUsers();

        // then
        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
       Assertions.assertEquals(1, response.getBody().size());
        Assertions.assertEquals(testUserDTO, response.getBody().get(0));
        Mockito.verify(userRepository).findAll();
        Mockito.verify(userMapper).apply(testUser);
    }
    @Test
    void getUserById_shouldReturnUser() {
        //given
        Mockito.when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        Mockito.when(userMapper.apply(testUser)).thenReturn(testUserDTO);
        //when
        ResponseEntity<UserDTO> response = userService.getUserById(testUser.getId());
        //then
        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(testUserDTO, response.getBody());
        Mockito.verify(userRepository).findById(testUser.getId());
        Mockito.verify(userMapper).apply(testUser);

    }
    @Test
    void getUserById_shouldReturnNotFoundWhenUserNotFound() {
        // given
        int nonExistentUserId = 2; // ID które nie istnieje
        Mockito.when(userRepository.findById(2)).thenReturn(Optional.empty());

        // when
        ResponseEntity<UserDTO> response = userService.getUserById(nonExistentUserId);

        // then
        Assertions.assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        Assertions.assertNull(response.getBody());
        Mockito.verify(userRepository).findById(nonExistentUserId);
    }
    @Test
    void deleteUserShouldDeleteUser() {
        //given
        Mockito.when(userRepository.existsById(testUser.getId())).thenReturn(true);
        //when
        ResponseEntity<Void> response = userService.deleteUser(testUser.getId());
        //then
        Assertions.assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        Mockito.verify(userRepository).existsById(testUser.getId());
        Mockito.verify(userRepository).deleteById(testUser.getId());

    }
    @Test
    void addUserShouldAddUser() {


    }

}
package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.mapper.UserMapper;
import pl.myproject.kanbanproject2.model.File;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.FileRepository;
import pl.myproject.kanbanproject2.repository.UserRepository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private FileRepository fileRepository;

    @Mock
    private MultipartFile multipartFile;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UserDTO testUserDTO;
    private File testFile;
    private Task testTask1;
    private Task testTask2;
    private TaskDTO testTaskDTO1;
    private TaskDTO testTaskDTO2;

    @BeforeEach
    void setUp() {
        // Tworzenie zadań testowych
        testTask1 = new Task();
        testTask1.setId(1);
        testTask1.setTitle("Test Task 1");
        testTask1.setCompleted(false);

        testTask2 = new Task();
        testTask2.setId(2);
        testTask2.setTitle("Test Task 2");
        testTask2.setCompleted(false);

        testTaskDTO1 = new TaskDTO(1, "Test Task 1", 1, 1, null, Set.of(1),
                new HashSet<>(), false, "Description 1", null, new HashSet<>(),
                LocalDateTime.now().plusDays(1), false);

        testTaskDTO2 = new TaskDTO(2, "Test Task 2", 2, 1, null, Set.of(1),
                new HashSet<>(), false, "Description 2", null, new HashSet<>(),
                LocalDateTime.now().plusDays(2), false);

        // Tworzenie użytkownika testowego
        testUser = new User();
        testUser.setId(1);
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");
        testUser.setWipLimit(5);
        testUser.setTasks(new HashSet<>());

        Set<TaskDTO> taskDTOs = new HashSet<>();
        taskDTOs.add(testTaskDTO1);
        taskDTOs.add(testTaskDTO2);
        testUserDTO = new UserDTO(1, "test@example.com", "Test User", taskDTOs, 5);

        // Tworzenie pliku testowego
        testFile = new File();
        testFile.setId(1L);
        testFile.setName("avatar.jpg");
        testFile.setType("image/jpeg");
        testFile.setData(new byte[]{1, 2, 3, 4, 5});
    }

    @Test
    void getAllUsers_WithUsersHavingTasks_ShouldReturnListOfUserDTOsWithTasks() {
        // Given
        Set<Task> tasks = new HashSet<>();
        tasks.add(testTask1);
        testUser.setTasks(tasks);

        List<User> users = Arrays.asList(testUser);
        when(userRepository.findAll()).thenReturn(users);
        when(userMapper.apply(testUser)).thenReturn(testUserDTO);

        // When
        List<UserDTO> result = userService.getAllUsers();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testUserDTO, result.get(0));
        verify(userRepository).findAll();
        verify(userMapper).apply(testUser);
    }

    @Test
    void getAllUsers_ShouldReturnListOfUserDTOs() {
        // Given
        List<User> users = Arrays.asList(testUser);
        when(userRepository.findAll()).thenReturn(users);
        when(userMapper.apply(testUser)).thenReturn(testUserDTO);

        // When
        List<UserDTO> result = userService.getAllUsers();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testUserDTO, result.get(0));
        verify(userRepository).findAll();
        verify(userMapper).apply(testUser);
    }

    @Test
    void getUserById_WithValidId_ShouldReturnUserDTO() {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(userMapper.apply(testUser)).thenReturn(testUserDTO);

        // When
        UserDTO result = userService.getUserById(1);

        // Then
        assertNotNull(result);
        assertEquals(testUserDTO, result);
        verify(userRepository).findById(1);
        verify(userMapper).apply(testUser);
    }

    @Test
    void getUserById_WithInvalidId_ShouldThrowResponseStatusException() {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.getUserById(1));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Nie ma użytkownika o takim id"));
        verify(userRepository).findById(1);
    }

    @Test
    void addUser_ShouldReturnSavedUser() {
        // Given
        when(userRepository.save(testUser)).thenReturn(testUser);

        // When
        User result = userService.addUser(testUser);

        // Then
        assertNotNull(result);
        assertEquals(testUser, result);
        verify(userRepository).save(testUser);
    }

    @Test
    void deleteUser_WithValidId_ShouldDeleteUser() {
        // Given
        when(userRepository.existsById(1)).thenReturn(true);

        // When
        userService.deleteUser(1);

        // Then
        verify(userRepository).existsById(1);
        verify(userRepository).deleteById(1);
    }

    @Test
    void deleteUser_WithInvalidId_ShouldThrowResponseStatusException() {
        // Given
        when(userRepository.existsById(1)).thenReturn(false);

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.deleteUser(1));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Nie ma użytkownika o takim id"));
        verify(userRepository).existsById(1);
        verify(userRepository, never()).deleteById(anyInt());
    }

    @Test
    void updateUser_WithValidId_ShouldUpdateAndReturnUser() {
        // Given
        User updateData = new User();
        updateData.setEmail("updated@example.com");
        updateData.setName("Updated Name");
        updateData.setWipLimit(10);

        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(userRepository.save(testUser)).thenReturn(testUser);

        // When
        User result = userService.updateUser(1, updateData);

        // Then
        assertNotNull(result);
        assertEquals("updated@example.com", testUser.getEmail());
        assertEquals("Updated Name", testUser.getName());
        assertEquals(10, testUser.getWipLimit());
        verify(userRepository).findById(1);
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUser_WithInvalidId_ShouldThrowResponseStatusException() {
        // Given
        User updateData = new User();
        when(userRepository.findById(1)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.updateUser(1, updateData));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Nie ma użytkownika o takim id"));
        verify(userRepository).findById(1);
        verify(userRepository, never()).save(any());
    }

    @Test
    void patchUser_WithValidId_ShouldUpdateAndReturnUserDTO() {
        // Given
        UserDTO patchData = new UserDTO(null, "patched@example.com", "Patched Name", null, 15);
        UserDTO expectedResult = new UserDTO(1, "patched@example.com", "Patched Name", new HashSet<>(), 15);

        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(userRepository.save(testUser)).thenReturn(testUser);
        when(userMapper.apply(testUser)).thenReturn(expectedResult);

        // When
        UserDTO result = userService.patchUser(patchData, 1);

        // Then
        assertNotNull(result);
        assertEquals(expectedResult, result);
        assertEquals("patched@example.com", testUser.getEmail());
        assertEquals("Patched Name", testUser.getName());
        assertEquals(15, testUser.getWipLimit());
        verify(userRepository).findById(1);
        verify(userRepository).save(testUser);
        verify(userMapper).apply(testUser);
    }

    @Test
    void patchUser_WithInvalidId_ShouldThrowResponseStatusException() {
        // Given
        UserDTO patchData = new UserDTO(null, "patched@example.com", null, null, null);
        when(userRepository.findById(1)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.patchUser(patchData, 1));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Nie ma użytkownika o takim id"));
        verify(userRepository).findById(1);
    }

    @Test
    void uploadAvatar_WithValidData_ShouldSaveAvatarAndUpdateUser() throws IOException {
        // Given
        byte[] fileData = {1, 2, 3, 4, 5};
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(multipartFile.getOriginalFilename()).thenReturn("avatar.jpg");
        when(multipartFile.getContentType()).thenReturn("image/jpeg");
        when(multipartFile.getBytes()).thenReturn(fileData);
        when(fileRepository.save(any(File.class))).thenReturn(testFile);

        // When
        userService.uploadAvatar(1, multipartFile);

        // Then
        verify(userRepository).findById(1);
        verify(fileRepository).save(any(File.class));
        verify(userRepository).save(testUser);
        assertNotNull(testUser.getAvatar());
    }

    @Test
    void uploadAvatar_WithInvalidUserId_ShouldThrowResponseStatusException() throws IOException {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.uploadAvatar(1, multipartFile));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Nie ma użytkownika o takim id"));
        verify(userRepository).findById(1);
        verify(fileRepository, never()).save(any());
    }

    @Test
    void uploadAvatar_WithIOException_ShouldThrowResponseStatusException() throws IOException {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(multipartFile.getOriginalFilename()).thenReturn("avatar.jpg");
        when(multipartFile.getContentType()).thenReturn("image/jpeg");
        when(multipartFile.getBytes()).thenThrow(new IOException("File read error"));

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.uploadAvatar(1, multipartFile));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Błąd podczas wczytywania avatara"));
        verify(userRepository).findById(1);
    }

    @Test
    void getAvatar_WithValidUserAndAvatar_ShouldReturnAvatarData() {
        // Given
        testUser.setAvatar(testFile);
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When
        byte[] result = userService.getAvatar(1);

        // Then
        assertNotNull(result);
        assertArrayEquals(testFile.getData(), result);
        verify(userRepository).findById(1);
    }

    @Test
    void getAvatar_WithInvalidUserId_ShouldThrowResponseStatusException() {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.getAvatar(1));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Nie ma użytkownika o takim id"));
        verify(userRepository).findById(1);
    }

    @Test
    void getAvatar_WithUserWithoutAvatar_ShouldThrowResponseStatusException() {
        // Given
        testUser.setAvatar(null);
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.getAvatar(1));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Użytkownik nie posiada avatara"));
        verify(userRepository).findById(1);
    }

    @Test
    void getAvatarContentType_WithValidUserAndAvatar_ShouldReturnContentType() {
        // Given
        testUser.setAvatar(testFile);
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When
        String result = userService.getAvatarContentType(1);

        // Then
        assertNotNull(result);
        assertEquals(testFile.getType(), result);
        verify(userRepository).findById(1);
    }

    @Test
    void getAvatarContentType_WithInvalidUserId_ShouldThrowResponseStatusException() {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.getAvatarContentType(1));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Nie ma użytkownika o takim id"));
        verify(userRepository).findById(1);
    }

    @Test
    void getAvatarContentType_WithUserWithoutAvatar_ShouldThrowResponseStatusException() {
        // Given
        testUser.setAvatar(null);
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.getAvatarContentType(1));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Użytkownik nie posiada avatara"));
        verify(userRepository).findById(1);
    }

    @Test
    void deleteAvatar_WithValidUserAndAvatar_ShouldDeleteAvatar() {
        // Given
        testUser.setAvatar(testFile);
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When
        userService.deleteAvatar(1);

        // Then
        assertNull(testUser.getAvatar());
        verify(userRepository).findById(1);
        verify(userRepository).save(testUser);
        verify(fileRepository).delete(testFile);
    }

    @Test
    void deleteAvatar_WithInvalidUserId_ShouldThrowResponseStatusException() {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.deleteAvatar(1));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Nie ma użytkownika o takim id"));
        verify(userRepository).findById(1);
    }

    @Test
    void deleteAvatar_WithUserWithoutAvatar_ShouldThrowResponseStatusException() {
        // Given
        testUser.setAvatar(null);
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.deleteAvatar(1));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Użytkownik nie posiada avatara"));
        verify(userRepository).findById(1);
        verify(fileRepository, never()).delete(any());
    }

    @Test
    void updateWipLimit_WithValidUserId_ShouldUpdateWipLimitAndReturnUserDTO() {
        // Given
        Integer newWipLimit = 20;
        UserDTO expectedResult = new UserDTO(1, "test@example.com", "Test User", new HashSet<>(), newWipLimit);

        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(userRepository.save(testUser)).thenReturn(testUser);
        when(userMapper.apply(testUser)).thenReturn(expectedResult);

        // When
        UserDTO result = userService.updateWipLimit(1, newWipLimit);

        // Then
        assertNotNull(result);
        assertEquals(expectedResult, result);
        assertEquals(newWipLimit, testUser.getWipLimit());
        verify(userRepository).findById(1);
        verify(userRepository).save(testUser);
        verify(userMapper).apply(testUser);
    }

    @Test
    void updateWipLimit_WithInvalidUserId_ShouldThrowResponseStatusException() {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.updateWipLimit(1, 20));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Nie ma użytkownika o takim id"));
        verify(userRepository).findById(1);
    }

    @Test
    void checkWipStatus_WithValidUserAndTasksBelowLimit_ShouldReturnTrue() {
        // Given
        testUser.setWipLimit(5);
        Set<Task> tasks = new HashSet<>();
        tasks.add(testTask1);
        tasks.add(testTask2);
        testUser.setTasks(tasks); // 2 tasks, limit is 5
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When
        boolean result = userService.checkWipStatus(1);

        // Then
        assertTrue(result);
        verify(userRepository).findById(1);
    }

    @Test
    void checkWipStatus_WithValidUserAndTasksAtLimit_ShouldReturnFalse() {
        // Given
        testUser.setWipLimit(2);
        Set<Task> tasks = new HashSet<>();
        tasks.add(testTask1);
        tasks.add(testTask2);
        testUser.setTasks(tasks); // 2 tasks, limit is 2
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When
        boolean result = userService.checkWipStatus(1);

        // Then
        assertFalse(result);
        verify(userRepository).findById(1);
    }

    @Test
    void checkWipStatus_WithValidUserAndTasksAboveLimit_ShouldReturnFalse() {
        // Given
        testUser.setWipLimit(1);
        Set<Task> tasks = new HashSet<>();
        tasks.add(testTask1);
        tasks.add(testTask2);
        testUser.setTasks(tasks); // 2 tasks, limit is 1
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When
        boolean result = userService.checkWipStatus(1);

        // Then
        assertFalse(result);
        verify(userRepository).findById(1);
    }

    @Test
    void checkWipStatus_WithValidUserAndNullWipLimit_ShouldReturnTrue() {
        // Given
        testUser.setWipLimit(null);
        Set<Task> tasks = new HashSet<>();
        tasks.add(testTask1);
        tasks.add(testTask2);
        testUser.setTasks(tasks); // Has tasks but no limit
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When
        boolean result = userService.checkWipStatus(1);

        // Then
        assertTrue(result);
        verify(userRepository).findById(1);
    }

    @Test
    void checkWipStatus_WithValidUserAndNoTasks_ShouldReturnTrue() {
        // Given
        testUser.setWipLimit(5);
        testUser.setTasks(new HashSet<>()); // 0 tasks, limit is 5
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When
        boolean result = userService.checkWipStatus(1);

        // Then
        assertTrue(result);
        verify(userRepository).findById(1);
    }

    @Test
    void checkWipStatus_WithValidUserAndZeroLimit_ShouldReturnFalse() {
        // Given
        testUser.setWipLimit(0);
        testUser.setTasks(new HashSet<>()); // 0 tasks, limit is 0
        when(userRepository.findById(1)).thenReturn(Optional.of(testUser));

        // When
        boolean result = userService.checkWipStatus(1);

        // Then
        assertFalse(result);
        verify(userRepository).findById(1);
    }

    @Test
    void checkWipStatus_WithInvalidUserId_ShouldThrowResponseStatusException() {
        // Given
        when(userRepository.findById(1)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.checkWipStatus(1));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("User not found"));
        verify(userRepository).findById(1);
    }
}
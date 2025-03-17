/*package pl.myproject.kanbanproject2.service;

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

import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.mapper.TaskMapper;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.TaskRepository;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@ExtendWith(MockitoExtension.class)
public class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskMapper taskMapper;

    @InjectMocks
    private TaskService taskService;

    private Task testTask;
    private TaskDTO testTaskDTO;
    private User testUser;
    private Column testColumn;

    @BeforeEach
    void setUp() {
        // Inicjalizacja danych testowych
        testUser = new User();
        testUser.setId(1);
        testUser.setName("Test User");

        Set<User> testUsers = new HashSet<>();
        testUsers.add(testUser);

        Set<Integer> testUserIds = new HashSet<>();
        testUserIds.add(testUser.getId());

        testColumn = new Column();
        testColumn.setId(1);
        testColumn.setName("Test Column");

        testTask = new Task();
        testTask.setId(1);
        testTask.setTitle("Test");
        testTask.setColumn(testColumn);
        testTask.setUsers(testUsers);

        // Zakładam konstruktor TaskDTO(Integer id, String title, Integer columnId, Set<Integer> userIds)
        testTaskDTO = new TaskDTO(1, "Test", testColumn.getId(), testUserIds);
    }

    @AfterEach
    void tearDown() {
        testTask = null;
        testTaskDTO = null;
        testUser = null;
        testColumn = null;
    }

    @Test
    void getAllTasksShouldReturnAllTasks() {
        // given
        List<Task> tasks = Collections.singletonList(testTask);
        Mockito.when(taskRepository.findAll()).thenReturn(tasks);
        Mockito.when(taskMapper.apply(testTask)).thenReturn(testTaskDTO);

        // when
        ResponseEntity<List<TaskDTO>> response = taskService.getAllTasks();

        // then
        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(1, response.getBody().size());
        Assertions.assertEquals(testTaskDTO, response.getBody().get(0));

        Mockito.verify(taskRepository).findAll();
        Mockito.verify(taskMapper).apply(testTask);
    }

    @Test
    void deleteTaskShouldDeleteExistingTask() {
        // given
        Mockito.when(taskRepository.existsById(testTask.getId())).thenReturn(true);

        // when
        ResponseEntity<Void> response = taskService.deleteTask(testTask.getId());

        // then
        Assertions.assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());

        Mockito.verify(taskRepository).existsById(testTask.getId());
        Mockito.verify(taskRepository).deleteById(testTask.getId());
    }

    @Test
    void deletingNonExistingTaskShouldReturnNotFound() {
        // given
        int nonExistingId = 999;
        Mockito.when(taskRepository.existsById(nonExistingId)).thenReturn(false);

        // when
        ResponseEntity<Void> response = taskService.deleteTask(nonExistingId);

        // then
        Assertions.assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());

        Mockito.verify(taskRepository).existsById(nonExistingId);
    }

    @Test
    void patchExistingTaskShouldUpdateAndReturnUpdatedDto() {
        // given
        Mockito.when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));
        Mockito.when(taskRepository.save(Mockito.any(Task.class))).thenReturn(testTask);
        Mockito.when(taskMapper.apply(Mockito.any(Task.class))).thenReturn(testTaskDTO);

        // when
        ResponseEntity<TaskDTO> response = taskService.patchTask(testTask.getId(), testTask);

        // then
        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(testTaskDTO, response.getBody());

        Mockito.verify(taskRepository).findById(testTask.getId());
        Mockito.verify(taskRepository).save(Mockito.any(Task.class));
        Mockito.verify(taskMapper).apply(Mockito.any(Task.class));
    }
}
*/
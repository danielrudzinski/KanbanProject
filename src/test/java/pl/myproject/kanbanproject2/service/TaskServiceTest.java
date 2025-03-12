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
import org.springframework.web.util.UriComponents;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.mapper.TaskMapper;
import pl.myproject.kanbanproject2.mapper.UserMapper;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.TaskRepository;
import pl.myproject.kanbanproject2.repository.UserRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.mockito.MockedStatic;
import java.net.URI;
@ExtendWith(MockitoExtension.class)
public class TaskServiceTest {
    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private ServletUriComponentsBuilder servletUriComponentsBuilder;

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

        testColumn = new Column();
        testColumn.setId(1);
        testColumn.setName("Test Column");

        testTask = new Task();
        testTask.setId(1);
        testTask.setTitle("Test");
        testTask.setColumn(testColumn);
        testTask.setUsers(testUsers);

        testTaskDTO = new TaskDTO(1,"test",testColumn.getId(),testUsers.getId());
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
        //given
        List<Task> tasks = Arrays.asList(testTask);
        Mockito.when(taskRepository.findAll()).thenReturn(tasks);
        Mockito.when(taskMapper.apply(testTask)).thenReturn(testTaskDTO);
        //when
        ResponseEntity<List<TaskDTO>> response = taskService.getAllTasks();
        //then
        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(1, response.getBody().size());
        Assertions.assertEquals(testTaskDTO, response.getBody().get(0));
        Mockito.verify(taskRepository).findAll();
        Mockito.verify(taskMapper).apply(testTask);

    }
    @Test
    void deleteTaskShouldDeleteTask() {
        //given
        Mockito.when(taskRepository.existsById(testTask.getId())).thenReturn(true);
        //when
        ResponseEntity<Void>response = taskService.deleteTask(testTask.getId());
        //then
        Assertions.assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        Mockito.verify(taskRepository).existsById(testTask.getId());
        Mockito.verify(taskRepository).deleteById(testTask.getId());
    }
    @Test
    void deletingNonExistingTaskShouldThrowException() {
        //given
        int notexistingid = 2;
        Mockito.when(taskRepository.existsById(notexistingid)).thenReturn(false);
        //when
        ResponseEntity<Void>response = taskService.deleteTask(notexistingid);
        //then
        Assertions.assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        Mockito.verify(taskRepository).existsById(notexistingid);

    }
    @Test
    void patchTaskShouldPatchTask() {
        //given
        Mockito.when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));
        Mockito.when(taskRepository.save(testTask)).thenReturn(testTask);
        Mockito.when(taskMapper.apply(testTask)).thenReturn(testTaskDTO);
        //when
        ResponseEntity<TaskDTO> response = taskService.patchTask(testTask.getId(),testTask);
        //then
        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(testTaskDTO, response.getBody());
        Mockito.verify(taskRepository).findById(testTask.getId());
        Mockito.verify(taskRepository).save(testTask);
        Mockito.verify(taskMapper).apply(testTask);


    }

}

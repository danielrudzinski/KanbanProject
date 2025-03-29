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
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.mapper.TaskMapper;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.model.Row;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.TaskRepository;
import pl.myproject.kanbanproject2.repository.UserRepository;

import java.util.*;
import java.util.stream.Collectors;

@ExtendWith(MockitoExtension.class)
public class TaskServiceTest {
    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private UserService userService;

    @InjectMocks
    private TaskService taskService;

    private Task testTask;
    private TaskDTO testTaskDTO;
    private User testUser;
    private Column testColumn;
    private Row testRow;
    private Set<String> testLabels;

    @BeforeEach
    void setUp() {
        // Initialize testUser
        testUser = new User();
        testUser.setId(1);
        testUser.setName("testUser");
        testUser.setTasks(new HashSet<>());

        // Initialize testColumn
        testColumn = new Column();
        testColumn.setId(1);
        testColumn.setName("TestColumn");
        testColumn.setPosition(1);

        // Initialize testRow
        testRow = new Row();
        testRow.setId(1);
        testRow.setName("TestRow");

        // Initialize testLabels
        testLabels = new HashSet<>();
        testLabels.add("important");
        testLabels.add("urgent");

        // Initialize testTask
        testTask = new Task();
        testTask.setId(1);
        testTask.setTitle("Test Task");
        testTask.setPosition(1);
        testTask.setCompleted(false);
        testTask.setDescription("Test description");
        testTask.setLabels(testLabels);
        testTask.setColumn(testColumn);
        testTask.setRow(testRow);

        Set<User> users = new HashSet<>();
        users.add(testUser);
        testTask.setUsers(users);

        // Initialize testTaskDTO
        testTaskDTO = new TaskDTO(
                1,
                "Test Task",
                1,
                1,
                1,
                Set.of(1),
                testLabels,
                false,
                "Test description"
        );
    }

    @AfterEach
    void tearDown() {
        testTask = null;
        testTaskDTO = null;
        testUser = null;
        testColumn = null;
        testRow = null;
        testLabels = null;
    }

    @Test
    void getAllTasksShouldReturnAllTasks() {
        // given
        List<Task> tasks = List.of(testTask);
        Mockito.when(taskRepository.findAll()).thenReturn(tasks);
        Mockito.when(taskMapper.apply(testTask)).thenReturn(testTaskDTO);

        // when
        List<TaskDTO> result = taskService.getAllTasks();

        // then
        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals(testTaskDTO, result.get(0));
        Mockito.verify(taskRepository).findAll();
        Mockito.verify(taskMapper).apply(testTask);
    }

    @Test
    void getTaskByIdShouldReturnTask() {
        // given
        Mockito.when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));
        Mockito.when(taskMapper.apply(testTask)).thenReturn(testTaskDTO);

        // when
        TaskDTO result = taskService.getTaskById(testTask.getId());

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testTaskDTO.id(), result.id());
        Assertions.assertEquals(testTaskDTO.title(), result.title());
        Assertions.assertEquals(testTaskDTO.position(), result.position());
        Assertions.assertEquals(testTaskDTO.columnId(), result.columnId());
        Assertions.assertEquals(testTaskDTO.rowId(), result.rowId());
        Assertions.assertEquals(testTaskDTO.userIds(), result.userIds());
        Assertions.assertEquals(testTaskDTO.labels(), result.labels());
        Mockito.verify(taskRepository).findById(testTask.getId());
        Mockito.verify(taskMapper).apply(testTask);
    }

    @Test
    void getTaskByIdShouldThrowExceptionWhenTaskNotFound() {
        // given
        int taskId = 99;
        Mockito.when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        // when & then
        Assertions.assertThrows(EntityNotFoundException.class, () -> taskService.getTaskById(taskId));
        Mockito.verify(taskRepository).findById(taskId);
    }

    @Test
    void addTaskShouldAddTaskWithPosition() {
        // given
        Task newTask = new Task();
        newTask.setTitle("New Task");
        newTask.setPosition(2);

        Mockito.when(taskRepository.save(Mockito.any(Task.class))).thenReturn(newTask);

        // when
        Task result = taskService.addTask(newTask);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals("New Task", result.getTitle());
        Assertions.assertEquals(2, result.getPosition());
        Mockito.verify(taskRepository).save(newTask);
    }

    @Test
    void addTaskShouldAddTaskWithoutPosition() {
        // given
        Task newTask = new Task();
        newTask.setTitle("New Task");
        newTask.setPosition(null);

        Task savedTask = new Task();
        savedTask.setTitle("New Task");
        savedTask.setPosition(2);

        Mockito.when(taskRepository.count()).thenReturn(1L);
        Mockito.when(taskRepository.save(Mockito.any(Task.class))).thenReturn(savedTask);

        // when
        Task result = taskService.addTask(newTask);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals("New Task", result.getTitle());
        Assertions.assertEquals(2, result.getPosition());
        Mockito.verify(taskRepository).count();
        Mockito.verify(taskRepository).save(Mockito.any(Task.class));
    }

    @Test
    void deleteTaskShouldDeleteTask() {
        // given
        int taskId = testTask.getId();
        Mockito.when(taskRepository.existsById(taskId)).thenReturn(true);

        // when
        taskService.deleteTask(taskId);

        // then
        Mockito.verify(taskRepository).existsById(taskId);
        Mockito.verify(taskRepository).deleteById(taskId);
    }

    @Test
    void deleteTaskShouldThrowExceptionWhenTaskNotFound() {
        // given
        int taskId = 99;
        Mockito.when(taskRepository.existsById(taskId)).thenReturn(false);

        // when & then
        Assertions.assertThrows(EntityNotFoundException.class, () -> taskService.deleteTask(taskId));
        Mockito.verify(taskRepository).existsById(taskId);
        Mockito.verify(taskRepository, Mockito.never()).deleteById(taskId);
    }

    @Test
    void patchTaskShouldUpdateTaskFields() {
        // given
        Task patchTask = new Task();
        patchTask.setTitle("Updated Title");
        patchTask.setPosition(3);

        Mockito.when(taskRepository.findById(testTask.getId())).thenReturn(Optional.of(testTask));
        Mockito.when(taskRepository.save(Mockito.any(Task.class))).thenReturn(testTask);
        Mockito.when(taskMapper.apply(testTask)).thenReturn(
                new TaskDTO(
                        1,
                        "Updated Title",
                        3,
                        1,
                        1,
                        Set.of(1),
                        testLabels,
                        false,
                        "Test description"
                )
        );

        // when
        TaskDTO result = taskService.patchTask(testTask.getId(), patchTask);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals("Updated Title", result.title());
        Assertions.assertEquals(3, result.position());
        Mockito.verify(taskRepository).findById(testTask.getId());
        Mockito.verify(taskRepository).save(testTask);
        Mockito.verify(taskMapper).apply(testTask);
    }

    @Test
    void assignUserToTaskShouldAssignUser() {
        // given
        int taskId = testTask.getId();
        int userId = testUser.getId();

        Task taskWithoutUser = new Task();
        taskWithoutUser.setId(taskId);
        taskWithoutUser.setTitle("Test Task");
        taskWithoutUser.setUsers(new HashSet<>());

        User userWithoutTask = new User();
        userWithoutTask.setId(userId);
        userWithoutTask.setName("testUser");
        userWithoutTask.setTasks(new HashSet<>());

        Mockito.when(userService.checkWipStatus(userId)).thenReturn(true);
        Mockito.when(taskRepository.findById(taskId)).thenReturn(Optional.of(taskWithoutUser));
        Mockito.when(userRepository.findById(userId)).thenReturn(Optional.of(userWithoutTask));
        Mockito.when(taskRepository.save(Mockito.any(Task.class))).thenReturn(testTask);
        Mockito.when(taskMapper.apply(testTask)).thenReturn(testTaskDTO);

        // when
        TaskDTO result = taskService.assignUserToTask(taskId, userId);

        // then
        Assertions.assertNotNull(result);
        Mockito.verify(userService).checkWipStatus(userId);
        Mockito.verify(taskRepository).findById(taskId);
        Mockito.verify(userRepository).findById(userId);
        Mockito.verify(userRepository).save(userWithoutTask);
        Mockito.verify(taskRepository).save(taskWithoutUser);
        Mockito.verify(taskMapper).apply(testTask);
    }

    @Test
    void assignUserToTaskShouldThrowExceptionWhenWipLimitExceeded() {
        // given
        int taskId = testTask.getId();
        int userId = testUser.getId();

        Mockito.when(userService.checkWipStatus(userId)).thenReturn(false);

        // when & then
        Assertions.assertThrows(RuntimeException.class, () -> taskService.assignUserToTask(taskId, userId));
        Mockito.verify(userService).checkWipStatus(userId);
        Mockito.verify(taskRepository, Mockito.never()).findById(taskId);
        Mockito.verify(userRepository, Mockito.never()).findById(userId);
    }

    @Test
    void removeUserFromTaskShouldRemoveUser() {
        // given
        int taskId = testTask.getId();
        int userId = testUser.getId();

        Mockito.when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        Mockito.when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        Mockito.when(taskRepository.save(Mockito.any(Task.class))).thenReturn(testTask);
        Mockito.when(taskMapper.apply(testTask)).thenReturn(
                new TaskDTO(
                        1,
                        "Test Task",
                        1,
                        1,
                        1,
                        Set.of(),
                        testLabels,
                        false,
                        "Test description"
                )
        );

        // when
        TaskDTO result = taskService.removeUserFromTask(taskId, userId);

        // then
        Assertions.assertNotNull(result);
        Mockito.verify(taskRepository).findById(taskId);
        Mockito.verify(userRepository).findById(userId);
        Mockito.verify(userRepository).save(testUser);
        Mockito.verify(taskRepository).save(testTask);
        Mockito.verify(taskMapper).apply(testTask);
    }

    @Test
    void updateTaskPositionShouldUpdatePosition() {
        // given
        int taskId = testTask.getId();
        int newPosition = 5;

        Mockito.when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        Mockito.when(taskRepository.save(Mockito.any(Task.class))).thenReturn(testTask);
        Mockito.when(taskMapper.apply(testTask)).thenReturn(
                new TaskDTO(
                        1,
                        "Test Task",
                        newPosition,
                        1,
                        1,
                        Set.of(1),
                        testLabels,
                        false,
                        "Test description"
                )
        );

        // when
        TaskDTO result = taskService.updateTaskPosition(taskId, newPosition);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(newPosition, result.position());
        Mockito.verify(taskRepository).findById(taskId);
        Mockito.verify(taskRepository).save(testTask);
        Mockito.verify(taskMapper).apply(testTask);
    }

    @Test
    void addLabelToTaskShouldAddLabel() {
        // given
        int taskId = testTask.getId();
        String newLabel = "newLabel";

        Set<String> updatedLabels = new HashSet<>(testLabels);
        updatedLabels.add(newLabel);

        Task updatedTask = new Task();
        updatedTask.setId(taskId);
        updatedTask.setTitle("Test Task");
        updatedTask.setLabels(updatedLabels);

        Mockito.when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        Mockito.when(taskRepository.save(Mockito.any(Task.class))).thenReturn(updatedTask);
        Mockito.when(taskMapper.apply(updatedTask)).thenReturn(
                new TaskDTO(
                        1,
                        "Test Task",
                        1,
                        1,
                        1,
                        Set.of(1),
                        updatedLabels,
                        false,
                        "Test description"
                )
        );

        // when
        TaskDTO result = taskService.addLabelToTask(taskId, newLabel);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertTrue(result.labels().contains(newLabel));
        Mockito.verify(taskRepository).findById(taskId);
        Mockito.verify(taskRepository).save(testTask);
        Mockito.verify(taskMapper).apply(updatedTask);
    }

    @Test
    void removeLabelFromTaskShouldRemoveLabel() {
        // given
        int taskId = testTask.getId();
        String labelToRemove = "important";

        Set<String> updatedLabels = new HashSet<>(testLabels);
        updatedLabels.remove(labelToRemove);

        Task updatedTask = new Task();
        updatedTask.setId(taskId);
        updatedTask.setTitle("Test Task");
        updatedTask.setLabels(updatedLabels);

        Mockito.when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        Mockito.when(taskRepository.save(Mockito.any(Task.class))).thenReturn(updatedTask);
        Mockito.when(taskMapper.apply(updatedTask)).thenReturn(
                new TaskDTO(
                        1,
                        "Test Task",
                        1,
                        1,
                        1,
                        Set.of(1),
                        updatedLabels,
                        false,
                        "Test description"
                )
        );

        // when
        TaskDTO result = taskService.removeLabelFromTask(taskId, labelToRemove);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertFalse(result.labels().contains(labelToRemove));
        Mockito.verify(taskRepository).findById(taskId);
        Mockito.verify(taskRepository).save(testTask);
        Mockito.verify(taskMapper).apply(updatedTask);
    }

    @Test
    void updateTaskLabelsShouldUpdateLabels() {
        // given
        int taskId = testTask.getId();
        Set<String> newLabels = Set.of("newLabel1", "newLabel2");

        Task updatedTask = new Task();
        updatedTask.setId(taskId);
        updatedTask.setTitle("Test Task");
        updatedTask.setLabels(newLabels);

        Mockito.when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        Mockito.when(taskRepository.save(Mockito.any(Task.class))).thenReturn(updatedTask);
        Mockito.when(taskMapper.apply(updatedTask)).thenReturn(
                new TaskDTO(
                        1,
                        "Test Task",
                        1,
                        1,
                        1,
                        Set.of(1),
                        newLabels,
                        false,
                        "Test description"
                )
        );

        // when
        TaskDTO result = taskService.updateTaskLabels(taskId, newLabels);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(newLabels, result.labels());
        Mockito.verify(taskRepository).findById(taskId);
        Mockito.verify(taskRepository).save(testTask);
        Mockito.verify(taskMapper).apply(updatedTask);
    }

    @Test
    void getAllLabelsShouldReturnAllLabels() {
        // given
        List<Task> tasks = List.of(testTask);
        Mockito.when(taskRepository.findAll()).thenReturn(tasks);

        // when
        Set<String> result = taskService.getAllLabels();

        // then
        Assertions.assertEquals(testLabels, result);
        Mockito.verify(taskRepository).findAll();
    }

    @Test
    void getAllLabelsShouldHandleException() {
        // given
        Mockito.when(taskRepository.findAll()).thenThrow(new RuntimeException("Test exception"));

        // when
        Set<String> result = taskService.getAllLabels();

        // then
        Assertions.assertTrue(result.isEmpty());
        Mockito.verify(taskRepository).findAll();
    }
}
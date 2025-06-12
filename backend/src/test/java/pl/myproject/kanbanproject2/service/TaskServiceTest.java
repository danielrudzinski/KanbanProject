package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.dto.TaskColumnHistoryDTO;
import pl.myproject.kanbanproject2.mapper.TaskMapper;
import pl.myproject.kanbanproject2.mapper.TaskColumnHistoryMapper;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.model.Row;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.TaskColumnHistory;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.TaskColumnHistoryRepository;
import pl.myproject.kanbanproject2.repository.TaskRepository;
import pl.myproject.kanbanproject2.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private UserService userService;

    @Mock
    private TaskColumnHistoryRepository taskColumnHistoryRepository;

    @Mock
    private TaskColumnHistoryMapper historyMapper;

    @InjectMocks
    private TaskService taskService;

    private Task task;
    private TaskDTO taskDTO;
    private User user;
    private Column column;
    private Row row;
    private TaskColumnHistory taskColumnHistory;
    private TaskColumnHistoryDTO taskColumnHistoryDTO;

    @BeforeEach
    void setUp() {
        // Task setup
        task = new Task();
        task.setId(1);
        task.setTitle("Test Task");
        task.setPosition(1);
        task.setCompleted(false);
        task.setLabels(new HashSet<>());
        task.setUsers(new HashSet<>());
        task.setChildTasks(new HashSet<>());

        // TaskDTO setup
        taskDTO = new TaskDTO(1, "Test Task", 1, 1, 1,
                Set.of(1), Set.of("label1"), false, "Description",
                null, Set.of(), null, false);

        // User setup
        user = new User();
        user.setId(1);
        user.setName("Test User");
        user.setEmail("test@example.com");
        user.setTasks(new HashSet<>());
        user.setWipLimit(5);

        // Column setup
        column = new Column();
        column.setId(1);
        column.setName("To Do");
        column.setPosition(1);

        // Row setup
        row = new Row();
        row.setId(1);
        row.setName("Row 1");
        row.setPosition(1);

        // TaskColumnHistory setup
        taskColumnHistory = new TaskColumnHistory();
        taskColumnHistory.setId(1);
        taskColumnHistory.setTask(task);
        taskColumnHistory.setColumn(column);
        taskColumnHistory.setChangedAt(LocalDateTime.now());
        taskColumnHistory.setHistoryOrder(0);

        // TaskColumnHistoryDTO setup
        taskColumnHistoryDTO = new TaskColumnHistoryDTO();
        taskColumnHistoryDTO.setId(1);
        taskColumnHistoryDTO.setTaskId(1);
        taskColumnHistoryDTO.setColumnId(1);
        taskColumnHistoryDTO.setColumnName("To Do");
        taskColumnHistoryDTO.setChangedAt(LocalDateTime.now());
    }

    @Test
    void addTask_ShouldSetPositionWhenNull() {
        // Given
        task.setPosition(null);
        when(taskRepository.count()).thenReturn(5L);
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        // When
        Task result = taskService.addTask(task);

        // Then
        assertEquals(6, result.getPosition());
        verify(taskRepository).save(task);
    }

    @Test
    void addTask_ShouldInitializeLabelsWhenNull() {
        // Given
        task.setLabels(null);
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        // When
        Task result = taskService.addTask(task);

        // Then
        assertNotNull(result.getLabels());
        assertTrue(result.getLabels().isEmpty());
        verify(taskRepository).save(task);
    }

    @Test
    void addTask_ShouldSaveTaskColumnHistoryWhenColumnExists() {
        // Given
        task.setColumn(column);
        when(taskRepository.save(any(Task.class))).thenReturn(task);
        when(taskColumnHistoryRepository.findByTaskOrderByChangedAtDesc(task)).thenReturn(new ArrayList<>());

        // When
        taskService.addTask(task);

        // Then
        verify(taskColumnHistoryRepository).save(any(TaskColumnHistory.class));
    }

    @Test
    void getAllTasks_ShouldReturnSortedTaskDTOs() {
        // Given
        List<Task> tasks = Arrays.asList(task);
        when(taskRepository.findAll()).thenReturn(tasks);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        List<TaskDTO> result = taskService.getAllTasks();

        // Then
        assertEquals(1, result.size());
        assertEquals(taskDTO, result.get(0));
        verify(taskRepository).findAll();
        verify(taskMapper).apply(task);
    }

    @Test
    void deleteTask_ShouldDeleteTaskAndHistory() {
        // Given
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskColumnHistoryRepository.findByTaskOrderByChangedAtDesc(task))
                .thenReturn(Arrays.asList(taskColumnHistory));

        // When
        taskService.deleteTask(1);

        // Then
        verify(taskColumnHistoryRepository).deleteAll(anyList());
        verify(taskRepository).delete(task);
    }

    @Test
    void deleteTask_ShouldThrowExceptionWhenTaskNotFound() {
        // Given
        when(taskRepository.findById(1)).thenReturn(Optional.empty());

        // When & Then
        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class,
                () -> taskService.deleteTask(1));
        assertNotNull(exception);
    }

    @Test
    void deleteTask_ShouldClearChildTasksParentReference() {
        // Given
        Task childTask = new Task();
        childTask.setId(2);
        childTask.setParentTask(task);

        // Use mutable HashSet instead of Set.of()
        Set<Task> childTasks = new HashSet<>();
        childTasks.add(childTask);
        task.setChildTasks(childTasks);

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskColumnHistoryRepository.findByTaskOrderByChangedAtDesc(task))
                .thenReturn(new ArrayList<>());

        // When
        taskService.deleteTask(1);

        // Then
        assertNull(childTask.getParentTask());
        verify(taskRepository).save(childTask);
        verify(taskRepository).delete(task);
    }

    @Test
    void getTaskById_ShouldReturnTaskDTO() {
        // Given
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.getTaskById(1);

        // Then
        assertEquals(taskDTO, result);
        verify(taskRepository).findById(1);
        verify(taskMapper).apply(task);
    }

    @Test
    void getTaskById_ShouldThrowExceptionWhenTaskNotFound() {
        // Given
        when(taskRepository.findById(1)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> taskService.getTaskById(1));
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void patchTask_ShouldUpdateTitle() {
        // Given
        Task updateTask = new Task();
        updateTask.setTitle("Updated Title");

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskRepository.save(task)).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.patchTask(1, updateTask);

        // Then
        assertEquals("Updated Title", task.getTitle());
        verify(taskRepository).save(task);
    }

    @Test
    void patchTask_ShouldSaveHistoryWhenColumnChanged() {
        // Given
        Column newColumn = new Column();
        newColumn.setId(2);
        newColumn.setName("In Progress");

        Task updateTask = new Task();
        updateTask.setColumn(newColumn);

        task.setColumn(column);

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskRepository.save(task)).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);
        when(taskColumnHistoryRepository.findByTaskOrderByChangedAtDesc(task))
                .thenReturn(new ArrayList<>());

        // When
        taskService.patchTask(1, updateTask);

        // Then
        verify(taskColumnHistoryRepository, times(2)).save(any(TaskColumnHistory.class));
    }

    @Test
    void assignUserToTask_ShouldAssignUserWhenWithinWipLimit() {
        // Given
        when(userService.checkWipStatus(1)).thenReturn(true);
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(taskRepository.save(task)).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.assignUserToTask(1, 1);

        // Then
        assertTrue(task.getUsers().contains(user));
        assertTrue(user.getTasks().contains(task));
        verify(userRepository).save(user);
        verify(taskRepository).save(task);
    }

    @Test
    void assignUserToTask_ShouldThrowExceptionWhenExceedsWipLimit() {
        // Given
        when(userService.checkWipStatus(1)).thenReturn(false);

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> taskService.assignUserToTask(1, 1));
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    @Test
    void removeUserFromTask_ShouldRemoveUserFromTask() {
        // Given
        task.getUsers().add(user);
        user.getTasks().add(task);

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(taskRepository.save(task)).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.removeUserFromTask(1, 1);

        // Then
        assertFalse(task.getUsers().contains(user));
        assertFalse(user.getTasks().contains(task));
        verify(userRepository).save(user);
        verify(taskRepository).save(task);
    }

    @Test
    void updateTaskPosition_ShouldUpdatePosition() {
        // Given
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskRepository.save(task)).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.updateTaskPosition(1, 5);

        // Then
        assertEquals(5, task.getPosition());
        verify(taskRepository).save(task);
    }

    @Test
    void addLabelToTask_ShouldAddLabel() {
        // Given
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskRepository.save(task)).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.addLabelToTask(1, "urgent");

        // Then
        assertTrue(task.getLabels().contains("urgent"));
        verify(taskRepository).save(task);
    }

    @Test
    void addLabelToTask_ShouldInitializeLabelsWhenNull() {
        // Given
        task.setLabels(null);
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskRepository.save(task)).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.addLabelToTask(1, "urgent");

        // Then
        assertNotNull(task.getLabels());
        assertTrue(task.getLabels().contains("urgent"));
        verify(taskRepository).save(task);
    }

    @Test
    void removeLabelFromTask_ShouldRemoveLabel() {
        // Given
        task.getLabels().add("urgent");
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskRepository.save(task)).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.removeLabelFromTask(1, "urgent");

        // Then
        assertFalse(task.getLabels().contains("urgent"));
        verify(taskRepository).save(task);
    }

    @Test
    void updateTaskLabels_ShouldReplaceAllLabels() {
        // Given
        Set<String> newLabels = Set.of("label1", "label2");
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskRepository.save(task)).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.updateTaskLabels(1, newLabels);

        // Then
        assertEquals(newLabels, task.getLabels());
        verify(taskRepository).save(task);
    }

    @Test
    void getAllLabels_ShouldReturnAllUniqueLabels() {
        // Given
        Task task1 = new Task();
        task1.setLabels(Set.of("label1", "label2"));
        Task task2 = new Task();
        task2.setLabels(Set.of("label2", "label3"));

        when(taskRepository.findAll()).thenReturn(Arrays.asList(task1, task2));

        // When
        Set<String> result = taskService.getAllLabels();

        // Then
        assertEquals(3, result.size());
        assertTrue(result.contains("label1"));
        assertTrue(result.contains("label2"));
        assertTrue(result.contains("label3"));
    }

    @Test
    void assignParentTask_ShouldAssignParent() {
        // Given
        Task parentTask = new Task();
        parentTask.setId(2);
        parentTask.setChildTasks(new HashSet<>());

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskRepository.findById(2)).thenReturn(Optional.of(parentTask));
        when(taskRepository.save(task)).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.assignParentTask(1, 2);

        // Then
        assertEquals(parentTask, task.getParentTask());
        assertTrue(parentTask.getChildTasks().contains(task));
        verify(taskRepository).save(task);
        verify(taskRepository).save(parentTask);
    }

    @Test
    void assignParentTask_ShouldThrowExceptionWhenCreatingCycle() {
        // Given
        Task childTask = new Task();
        childTask.setId(2);

        // Use mutable HashSet
        Set<Task> childTasks = new HashSet<>();
        childTasks.add(task);
        childTask.setChildTasks(childTasks);
        task.setParentTask(childTask);

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskRepository.findById(2)).thenReturn(Optional.of(childTask));

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> taskService.assignParentTask(1, 2));
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    @Test
    void removeParentTask_ShouldRemoveParentRelation() {
        // Given
        Task parentTask = new Task();
        parentTask.setId(2);
        parentTask.setChildTasks(new HashSet<>());
        parentTask.getChildTasks().add(task);
        task.setParentTask(parentTask);

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        // Use lenient to allow multiple saves of different objects
        lenient().when(taskRepository.save(any(Task.class))).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.removeParentTask(1);

        // Then
        assertNull(task.getParentTask());
        assertFalse(parentTask.getChildTasks().contains(task));
        verify(taskRepository, times(2)).save(any(Task.class));
    }

    @Test
    void getChildTasks_ShouldReturnChildTaskDTOs() {
        // Given
        Task childTask = new Task();
        childTask.setId(2);

        // Use mutable HashSet
        Set<Task> childTasks = new HashSet<>();
        childTasks.add(childTask);
        task.setChildTasks(childTasks);

        TaskDTO childTaskDTO = new TaskDTO(2, "Child Task", 1, 1, 1,
                Set.of(), Set.of(), false, "", 1, Set.of(), null, false);

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskMapper.apply(childTask)).thenReturn(childTaskDTO);

        // When
        List<TaskDTO> result = taskService.getChildTasks(1);

        // Then
        assertEquals(1, result.size());
        assertEquals(childTaskDTO, result.get(0));
    }

    @Test
    void getParentTask_ShouldReturnParentTaskDTO() {
        // Given
        Task parentTask = new Task();
        parentTask.setId(2);
        task.setParentTask(parentTask);

        TaskDTO parentTaskDTO = new TaskDTO(2, "Parent Task", 1, 1, 1,
                Set.of(), Set.of(), false, "", null, Set.of(1), null, false);

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskMapper.apply(parentTask)).thenReturn(parentTaskDTO);

        // When
        TaskDTO result = taskService.getParentTask(1);

        // Then
        assertEquals(parentTaskDTO, result);
    }

    @Test
    void getParentTask_ShouldThrowExceptionWhenNoParent() {
        // Given
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> taskService.getParentTask(1));
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void canTaskBeCompleted_ShouldReturnTrueWhenNoParent() {
        // Given
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));

        // When
        boolean result = taskService.canTaskBeCompleted(1);

        // Then
        assertTrue(result);
    }

    @Test
    void canTaskBeCompleted_ShouldReturnFalseWhenParentNotCompleted() {
        // Given
        Task parentTask = new Task();
        parentTask.setCompleted(false);
        task.setParentTask(parentTask);

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));

        // When
        boolean result = taskService.canTaskBeCompleted(1);

        // Then
        assertFalse(result);
    }

    @Test
    void canTaskBeCompleted_ShouldReturnTrueWhenParentCompleted() {
        // Given
        Task parentTask = new Task();
        parentTask.setCompleted(true);
        task.setParentTask(parentTask);

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));

        // When
        boolean result = taskService.canTaskBeCompleted(1);

        // Then
        assertTrue(result);
    }

    @Test
    void updateTaskCompletion_ShouldCompleteTaskWhenAllowed() {
        // Given
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskRepository.save(task)).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.updateTaskCompletion(1, true);

        // Then
        assertTrue(task.isCompleted());
        verify(taskRepository).save(task);
    }

    @Test
    void updateTaskCompletion_ShouldThrowExceptionWhenParentNotCompleted() {
        // Given
        Task parentTask = new Task();
        parentTask.setCompleted(false);
        task.setParentTask(parentTask);

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> taskService.updateTaskCompletion(1, true));
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    @Test
    void updateTaskCompletion_ShouldMarkChildTasksIncompleteWhenParentMarkedIncomplete() {
        // Given
        Task childTask = new Task();
        childTask.setId(2);
        childTask.setCompleted(true);
        childTask.setChildTasks(new HashSet<>());

        // Use mutable HashSet
        Set<Task> childTasks = new HashSet<>();
        childTasks.add(childTask);
        task.setChildTasks(childTasks);
        task.setCompleted(true);

        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        // Use lenient to allow multiple saves of different objects
        lenient().when(taskRepository.save(any(Task.class))).thenReturn(task);
        when(taskMapper.apply(task)).thenReturn(taskDTO);

        // When
        TaskDTO result = taskService.updateTaskCompletion(1, false);

        // Then
        assertFalse(task.isCompleted());
        assertFalse(childTask.isCompleted());
        verify(taskRepository, atLeast(2)).save(any(Task.class));
    }

    @Test
    void getTaskColumnHistory_ShouldReturnHistory() {
        // Given
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskColumnHistoryRepository.findByTaskOrderByChangedAtDesc(task))
                .thenReturn(Arrays.asList(taskColumnHistory));

        // When
        List<TaskColumnHistory> result = taskService.getTaskColumnHistory(1);

        // Then
        assertEquals(1, result.size());
        assertEquals(taskColumnHistory, result.get(0));
    }

    @Test
    void getTaskColumnHistoryDTOs_ShouldReturnHistoryDTOs() {
        // Given
        when(taskRepository.findById(1)).thenReturn(Optional.of(task));
        when(taskColumnHistoryRepository.findByTaskOrderByChangedAtDesc(task))
                .thenReturn(Arrays.asList(taskColumnHistory));
        when(historyMapper.toDTO(taskColumnHistory)).thenReturn(taskColumnHistoryDTO);

        // When
        List<TaskColumnHistoryDTO> result = taskService.getTaskColumnHistoryDTOs(1);

        // Then
        assertEquals(1, result.size());
        assertEquals(taskColumnHistoryDTO, result.get(0));
    }

    @Test
    void checkAllTasksDeadlines_ShouldUpdateExpiredStatus() {
        // Given
        Task expiredTask = new Task();
        expiredTask.setId(1);
        expiredTask.setDeadline(LocalDateTime.now().minusDays(1));
        expiredTask.setExpired(false);

        Task notExpiredTask = new Task();
        notExpiredTask.setId(2);
        notExpiredTask.setDeadline(LocalDateTime.now().plusDays(1));
        notExpiredTask.setExpired(true);

        when(taskRepository.findAllByDeadlineIsNotNull())
                .thenReturn(Arrays.asList(expiredTask, notExpiredTask));

        // When
        taskService.checkAllTasksDeadlines();

        // Then
        assertTrue(expiredTask.isExpired());
        assertFalse(notExpiredTask.isExpired());
        verify(taskRepository, times(2)).save(any(Task.class));
    }
}
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
import pl.myproject.kanbanproject2.dto.SubTaskDTO;
import pl.myproject.kanbanproject2.mapper.SubTaskMapper;
import pl.myproject.kanbanproject2.model.SubTask;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.repository.SubTaskRepository;
import pl.myproject.kanbanproject2.repository.TaskRepository;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubTaskServiceTest {

    @Mock
    private SubTaskRepository subTaskRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private SubTaskMapper subTaskMapper;

    @InjectMocks
    private SubTaskService subTaskService;

    private SubTask testSubTask;
    private SubTaskDTO testSubTaskDTO;
    private Task testTask;

    @BeforeEach
    void setUp() {
        testTask = new Task();
        testTask.setId(1);
        testTask.setTitle("Test Task");
        testTask.setSubTasks(new ArrayList<>());

        testSubTask = new SubTask();
        testSubTask.setId(1);
        testSubTask.setTitle("Test SubTask");
        testSubTask.setDescription("Test Description");
        testSubTask.setCompleted(false);
        testSubTask.setPosition(1);
        testSubTask.setTask(testTask);

        testSubTaskDTO = new SubTaskDTO(1, "Test SubTask", "Test Description", false, 1, 1);
    }

    @Test
    void addSubTask_WithPosition_ShouldSaveSubTask() {
        // Given
        SubTask subTaskWithPosition = new SubTask();
        subTaskWithPosition.setPosition(5);
        when(subTaskRepository.save(any(SubTask.class))).thenReturn(subTaskWithPosition);

        // When
        SubTask result = subTaskService.addSubTask(subTaskWithPosition);

        // Then
        assertNotNull(result);
        assertEquals(5, result.getPosition());
        verify(subTaskRepository).save(subTaskWithPosition);
        verify(subTaskRepository, never()).count();
    }

    @Test
    void addSubTask_WithoutPosition_ShouldSetPositionBasedOnCount() {
        // Given
        SubTask subTaskWithoutPosition = new SubTask();
        when(subTaskRepository.count()).thenReturn(3L);
        when(subTaskRepository.save(any(SubTask.class))).thenReturn(subTaskWithoutPosition);

        // When
        SubTask result = subTaskService.addSubTask(subTaskWithoutPosition);

        // Then
        assertNotNull(result);
        assertEquals(4, subTaskWithoutPosition.getPosition());
        verify(subTaskRepository).count();
        verify(subTaskRepository).save(subTaskWithoutPosition);
    }

    @Test
    void getAllSubTasks_ShouldReturnListOfSubTaskDTOs() {
        // Given
        List<SubTask> subTasks = Arrays.asList(testSubTask);
        when(subTaskRepository.findAll()).thenReturn(subTasks);
        when(subTaskMapper.toDto(testSubTask)).thenReturn(testSubTaskDTO);

        // When
        List<SubTaskDTO> result = subTaskService.getAllSubTasks();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testSubTaskDTO, result.get(0));
        verify(subTaskRepository).findAll();
        verify(subTaskMapper).toDto(testSubTask);
    }

    @Test
    void deleteSubTask_ExistingId_ShouldDeleteSuccessfully() {
        // Given
        Integer subTaskId = 1;
        when(subTaskRepository.existsById(subTaskId)).thenReturn(true);

        // When
        assertDoesNotThrow(() -> subTaskService.deleteSubTask(subTaskId));

        // Then
        verify(subTaskRepository).existsById(subTaskId);
        verify(subTaskRepository).deleteById(subTaskId);
    }

    @Test
    void deleteSubTask_NonExistingId_ShouldThrowResponseStatusException() {
        // Given
        Integer subTaskId = 999;
        when(subTaskRepository.existsById(subTaskId)).thenReturn(false);

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> subTaskService.deleteSubTask(subTaskId));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Nie ma podzadania o takim id"));
        verify(subTaskRepository).existsById(subTaskId);
        verify(subTaskRepository, never()).deleteById(subTaskId);
    }

    @Test
    void getSubTaskById_ExistingId_ShouldReturnSubTaskDTO() {
        // Given
        Integer subTaskId = 1;
        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(testSubTask));
        when(subTaskMapper.toDto(testSubTask)).thenReturn(testSubTaskDTO);

        // When
        SubTaskDTO result = subTaskService.getSubTaskById(subTaskId);

        // Then
        assertNotNull(result);
        assertEquals(testSubTaskDTO, result);
        verify(subTaskRepository).findById(subTaskId);
        verify(subTaskMapper).toDto(testSubTask);
    }

    @Test
    void getSubTaskById_NonExistingId_ShouldThrowResponseStatusException() {
        // Given
        Integer subTaskId = 999;
        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> subTaskService.getSubTaskById(subTaskId));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Nie ma podzadania o takim id"));
        verify(subTaskRepository).findById(subTaskId);
        verify(subTaskMapper, never()).toDto(any());
    }

    @Test
    void patchSubTask_ExistingId_ShouldUpdateAndReturnDTO() {
        // Given
        Integer subTaskId = 1;
        SubTask updateData = new SubTask();
        updateData.setTitle("Updated Title");
        updateData.setDescription("Updated Description");
        updateData.setCompleted(true);
        updateData.setPosition(2);

        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(testSubTask));
        when(subTaskRepository.save(any(SubTask.class))).thenReturn(testSubTask);
        when(subTaskMapper.toDto(testSubTask)).thenReturn(testSubTaskDTO);

        // When
        SubTaskDTO result = subTaskService.patchSubTask(subTaskId, updateData);

        // Then
        assertNotNull(result);
        assertEquals("Updated Title", testSubTask.getTitle());
        assertEquals("Updated Description", testSubTask.getDescription());
        assertTrue(testSubTask.isCompleted());
        assertEquals(2, testSubTask.getPosition());
        verify(subTaskRepository).findById(subTaskId);
        verify(subTaskRepository).save(testSubTask);
        verify(subTaskMapper).toDto(testSubTask);
    }

    @Test
    void patchSubTask_NonExistingId_ShouldThrowResponseStatusException() {
        // Given
        Integer subTaskId = 999;
        SubTask updateData = new SubTask();
        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> subTaskService.patchSubTask(subTaskId, updateData));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(subTaskRepository).findById(subTaskId);
        verify(subTaskRepository, never()).save(any());
    }

    @Test
    void assignTaskToSubTask_BothExist_ShouldAssignSuccessfully() {
        // Given
        Integer subTaskId = 1;
        Integer taskId = 1;
        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(testSubTask));
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        when(subTaskRepository.save(testSubTask)).thenReturn(testSubTask);
        when(subTaskMapper.toDto(testSubTask)).thenReturn(testSubTaskDTO);

        // When
        SubTaskDTO result = subTaskService.assignTaskToSubTask(subTaskId, taskId);

        // Then
        assertNotNull(result);
        assertEquals(testTask, testSubTask.getTask());
        assertTrue(testTask.getSubTasks().contains(testSubTask));
        verify(subTaskRepository).findById(subTaskId);
        verify(taskRepository).findById(taskId);
        verify(taskRepository).save(testTask);
        verify(subTaskRepository).save(testSubTask);
        verify(subTaskMapper).toDto(testSubTask);
    }

    @Test
    void assignTaskToSubTask_SubTaskNotFound_ShouldThrowException() {
        // Given
        Integer subTaskId = 999;
        Integer taskId = 1;
        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> subTaskService.assignTaskToSubTask(subTaskId, taskId));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(subTaskRepository).findById(subTaskId);
        verify(taskRepository, never()).findById(any());
    }

    @Test
    void assignTaskToSubTask_TaskNotFound_ShouldThrowException() {
        // Given
        Integer subTaskId = 1;
        Integer taskId = 999;
        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(testSubTask));
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> subTaskService.assignTaskToSubTask(subTaskId, taskId));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(subTaskRepository).findById(subTaskId);
        verify(taskRepository).findById(taskId);
    }

    @Test
    void getSubTasksByTaskId_ExistingTask_ShouldReturnSubTasks() {
        // Given
        Integer taskId = 1;
        testTask.getSubTasks().add(testSubTask);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        when(subTaskMapper.toDto(testSubTask)).thenReturn(testSubTaskDTO);

        // When
        List<SubTaskDTO> result = subTaskService.getSubTasksByTaskId(taskId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testSubTaskDTO, result.get(0));
        verify(taskRepository).findById(taskId);
        verify(subTaskMapper).toDto(testSubTask);
    }

    @Test
    void getSubTasksByTaskId_NonExistingTask_ShouldThrowException() {
        // Given
        Integer taskId = 999;
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> subTaskService.getSubTasksByTaskId(taskId));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(taskRepository).findById(taskId);
    }

    @Test
    void toggleSubTaskCompletion_ExistingSubTask_ShouldToggleStatus() {
        // Given
        Integer subTaskId = 1;
        testSubTask.setCompleted(false);
        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(testSubTask));
        when(subTaskRepository.save(testSubTask)).thenReturn(testSubTask);
        when(subTaskMapper.toDto(testSubTask)).thenReturn(testSubTaskDTO);

        // When
        SubTaskDTO result = subTaskService.toggleSubTaskCompletion(subTaskId);

        // Then
        assertNotNull(result);
        assertTrue(testSubTask.isCompleted());
        verify(subTaskRepository).findById(subTaskId);
        verify(subTaskRepository).save(testSubTask);
        verify(subTaskMapper).toDto(testSubTask);
    }

    @Test
    void toggleSubTaskCompletion_NonExistingSubTask_ShouldThrowException() {
        // Given
        Integer subTaskId = 999;
        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> subTaskService.toggleSubTaskCompletion(subTaskId));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(subTaskRepository).findById(subTaskId);
        verify(subTaskRepository, never()).save(any());
    }

    @Test
    void updateSubTaskPosition_ExistingSubTask_ShouldUpdatePosition() {
        // Given
        Integer subTaskId = 1;
        Integer newPosition = 5;
        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(testSubTask));
        when(subTaskRepository.save(testSubTask)).thenReturn(testSubTask);
        when(subTaskMapper.toDto(testSubTask)).thenReturn(testSubTaskDTO);

        // When
        SubTaskDTO result = subTaskService.updateSubTaskPosition(subTaskId, newPosition);

        // Then
        assertNotNull(result);
        assertEquals(newPosition, testSubTask.getPosition());
        verify(subTaskRepository).findById(subTaskId);
        verify(subTaskRepository).save(testSubTask);
        verify(subTaskMapper).toDto(testSubTask);
    }

    @Test
    void updateSubTaskPosition_NonExistingSubTask_ShouldThrowException() {
        // Given
        Integer subTaskId = 999;
        Integer newPosition = 5;
        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> subTaskService.updateSubTaskPosition(subTaskId, newPosition));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(subTaskRepository).findById(subTaskId);
        verify(subTaskRepository, never()).save(any());
    }

    @Test
    void patchSubTask_PartialUpdate_ShouldUpdateOnlyProvidedFields() {
        // Given
        Integer subTaskId = 1;
        SubTask partialUpdate = new SubTask();
        partialUpdate.setTitle("Only Title Updated");
        // Pozostałe pola null

        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(testSubTask));
        when(subTaskRepository.save(testSubTask)).thenReturn(testSubTask);
        when(subTaskMapper.toDto(testSubTask)).thenReturn(testSubTaskDTO);

        String originalDescription = testSubTask.getDescription();
        boolean originalCompleted = testSubTask.isCompleted();
        Integer originalPosition = testSubTask.getPosition();

        // When
        SubTaskDTO result = subTaskService.patchSubTask(subTaskId, partialUpdate);

        // Then
        assertNotNull(result);
        assertEquals("Only Title Updated", testSubTask.getTitle());
        assertEquals(originalDescription, testSubTask.getDescription());
        assertEquals(originalCompleted, testSubTask.isCompleted());
        assertEquals(originalPosition, testSubTask.getPosition());
    }

    @Test
    void patchSubTask_WithTaskAssignment_ShouldUpdateTask() {
        // Given
        Integer subTaskId = 1;
        Task newTask = new Task();
        newTask.setId(2);

        SubTask updateData = new SubTask();
        updateData.setTask(newTask);

        when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(testSubTask));
        when(subTaskRepository.save(testSubTask)).thenReturn(testSubTask);
        when(subTaskMapper.toDto(testSubTask)).thenReturn(testSubTaskDTO);

        // When
        SubTaskDTO result = subTaskService.patchSubTask(subTaskId, updateData);

        // Then
        assertNotNull(result);
        assertEquals(newTask, testSubTask.getTask());
        verify(subTaskRepository).save(testSubTask);
    }
}
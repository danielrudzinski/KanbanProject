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
import pl.myproject.kanbanproject2.dto.SubTaskDTO;
import pl.myproject.kanbanproject2.mapper.SubTaskMapper;
import pl.myproject.kanbanproject2.model.SubTask;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.repository.SubTaskRepository;
import pl.myproject.kanbanproject2.repository.TaskRepository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
public class SubTaskServiceTest {

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
        testTask.setSubTasks(new ArrayList<>());

        testSubTask = new SubTask();
        testSubTask.setId(1);
        testSubTask.setTitle("Test SubTask");
        testSubTask.setDescription("Test Description");
        testSubTask.setCompleted(false);
        testSubTask.setPosition(1);
        testSubTask.setTask(testTask);

        testSubTaskDTO = new SubTaskDTO(
                1,
                "Test SubTask",
                "Test Description",
                false,
                1,
                1
        );
    }

    @AfterEach
    void tearDown() {
        testSubTask = null;
        testSubTaskDTO = null;
        testTask = null;
    }

    @Test
    void addSubTaskWithPositionShouldAddSubTask() {
        // given
        Mockito.when(subTaskRepository.save(testSubTask)).thenReturn(testSubTask);

        // when
        SubTask result = subTaskService.addSubTask(testSubTask);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testSubTask.getId(), result.getId());
        Assertions.assertEquals(testSubTask.getTitle(), result.getTitle());
        Assertions.assertEquals(testSubTask.getDescription(), result.getDescription());
        Assertions.assertEquals(testSubTask.isCompleted(), result.isCompleted());
        Assertions.assertEquals(testSubTask.getPosition(), result.getPosition());
        Assertions.assertEquals(testSubTask.getTask(), result.getTask());

        Mockito.verify(subTaskRepository).save(testSubTask);
    }

    @Test
    void addSubTaskWithoutPositionShouldSetPositionAndAddSubTask() {
        // given
        SubTask subTaskWithoutPosition = new SubTask();
        subTaskWithoutPosition.setId(2);
        subTaskWithoutPosition.setTitle("SubTask without position");
        subTaskWithoutPosition.setDescription("Description");
        subTaskWithoutPosition.setCompleted(false);
        subTaskWithoutPosition.setPosition(null);  // bez pozycji

        SubTask savedSubTask = new SubTask();
        savedSubTask.setId(2);
        savedSubTask.setTitle("SubTask without position");
        savedSubTask.setDescription("Description");
        savedSubTask.setCompleted(false);
        savedSubTask.setPosition(3);  // pozycja ustawiona przez serwis

        Mockito.when(subTaskRepository.count()).thenReturn(2L);
        Mockito.when(subTaskRepository.save(Mockito.any(SubTask.class))).thenReturn(savedSubTask);

        // when
        SubTask result = subTaskService.addSubTask(subTaskWithoutPosition);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(savedSubTask.getId(), result.getId());
        Assertions.assertEquals(savedSubTask.getTitle(), result.getTitle());
        Assertions.assertEquals(savedSubTask.getDescription(), result.getDescription());
        Assertions.assertEquals(savedSubTask.isCompleted(), result.isCompleted());
        Assertions.assertEquals(3, result.getPosition());  // sprawdzenie ustawionej pozycji

        Mockito.verify(subTaskRepository).count();
        Mockito.verify(subTaskRepository).save(Mockito.any(SubTask.class));
    }

    @Test
    void getAllSubTasksShouldReturnAllSubTasks() {
        // given
        List<SubTask> subTasks = Arrays.asList(testSubTask);
        Mockito.when(subTaskRepository.findAll()).thenReturn(subTasks);
        Mockito.when(subTaskMapper.toDto(testSubTask)).thenReturn(testSubTaskDTO);

        // when
        List<SubTaskDTO> result = subTaskService.getAllSubTasks();

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals(testSubTaskDTO, result.get(0));

        Mockito.verify(subTaskRepository).findAll();
        Mockito.verify(subTaskMapper).toDto(testSubTask);
    }

    @Test
    void getSubTaskByIdShouldReturnSubTask() {
        // given
        Integer subTaskId = testSubTask.getId();
        Mockito.when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(testSubTask));
        Mockito.when(subTaskMapper.toDto(testSubTask)).thenReturn(testSubTaskDTO);

        // when
        SubTaskDTO result = subTaskService.getSubTaskById(subTaskId);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testSubTaskDTO.id(), result.id());
        Assertions.assertEquals(testSubTaskDTO.title(), result.title());
        Assertions.assertEquals(testSubTaskDTO.description(), result.description());
        Assertions.assertEquals(testSubTaskDTO.completed(), result.completed());
        Assertions.assertEquals(testSubTaskDTO.position(), result.position());
        Assertions.assertEquals(testSubTaskDTO.taskId(), result.taskId());

        Mockito.verify(subTaskRepository).findById(subTaskId);
        Mockito.verify(subTaskMapper).toDto(testSubTask);
    }

    @Test
    void getSubTaskByIdShouldThrowExceptionWhenSubTaskNotFound() {
        // given
        Integer subTaskId = 99;
        Mockito.when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.empty());

        // when & then
        Assertions.assertThrows(EntityNotFoundException.class,
                () -> subTaskService.getSubTaskById(subTaskId));

        Mockito.verify(subTaskRepository).findById(subTaskId);
        Mockito.verify(subTaskMapper, Mockito.never()).toDto(Mockito.any(SubTask.class));
    }

    @Test
    void deleteSubTaskShouldDeleteSubTask() {
        // given
        Integer subTaskId = testSubTask.getId();
        Mockito.when(subTaskRepository.existsById(subTaskId)).thenReturn(true);

        // when
        subTaskService.deleteSubTask(subTaskId);

        // then
        Mockito.verify(subTaskRepository).existsById(subTaskId);
        Mockito.verify(subTaskRepository).deleteById(subTaskId);
    }

    @Test
    void deleteSubTaskShouldThrowExceptionWhenSubTaskNotFound() {
        // given
        Integer subTaskId = 99;
        Mockito.when(subTaskRepository.existsById(subTaskId)).thenReturn(false);

        // when & then
        Assertions.assertThrows(EntityNotFoundException.class,
                () -> subTaskService.deleteSubTask(subTaskId));

        Mockito.verify(subTaskRepository).existsById(subTaskId);
        Mockito.verify(subTaskRepository, Mockito.never()).deleteById(subTaskId);
    }

    @Test
    void patchSubTaskShouldUpdateSubTaskFields() {
        // given
        Integer subTaskId = testSubTask.getId();
        SubTask patchSubTask = new SubTask();
        patchSubTask.setTitle("Updated Title");
        patchSubTask.setDescription("Updated Description");
        patchSubTask.setCompleted(true);
        patchSubTask.setPosition(2);

        SubTask existingSubTask = new SubTask();
        existingSubTask.setId(subTaskId);
        existingSubTask.setTitle("Original Title");
        existingSubTask.setDescription("Original Description");
        existingSubTask.setCompleted(false);
        existingSubTask.setPosition(1);
        existingSubTask.setTask(testTask);

        SubTask updatedSubTask = new SubTask();
        updatedSubTask.setId(subTaskId);
        updatedSubTask.setTitle("Updated Title");
        updatedSubTask.setDescription("Updated Description");
        updatedSubTask.setCompleted(true);
        updatedSubTask.setPosition(2);
        updatedSubTask.setTask(testTask);

        SubTaskDTO updatedSubTaskDTO = new SubTaskDTO(
                subTaskId,
                "Updated Title",
                "Updated Description",
                true,
                2,
                testTask.getId()
        );

        Mockito.when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(existingSubTask));
        Mockito.when(subTaskRepository.save(Mockito.any(SubTask.class))).thenReturn(updatedSubTask);
        Mockito.when(subTaskMapper.toDto(updatedSubTask)).thenReturn(updatedSubTaskDTO);

        // when
        SubTaskDTO result = subTaskService.patchSubTask(subTaskId, patchSubTask);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(updatedSubTaskDTO.id(), result.id());
        Assertions.assertEquals(updatedSubTaskDTO.title(), result.title());
        Assertions.assertEquals(updatedSubTaskDTO.description(), result.description());
        Assertions.assertEquals(updatedSubTaskDTO.completed(), result.completed());
        Assertions.assertEquals(updatedSubTaskDTO.position(), result.position());
        Assertions.assertEquals(updatedSubTaskDTO.taskId(), result.taskId());

        Mockito.verify(subTaskRepository).findById(subTaskId);
        Mockito.verify(subTaskRepository).save(Mockito.any(SubTask.class));
        Mockito.verify(subTaskMapper).toDto(updatedSubTask);
    }

    @Test
    void patchSubTaskShouldThrowExceptionWhenSubTaskNotFound() {
        // given
        Integer subTaskId = 99;
        SubTask patchSubTask = new SubTask();

        Mockito.when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.empty());

        // when & then
        Assertions.assertThrows(EntityNotFoundException.class,
                () -> subTaskService.patchSubTask(subTaskId, patchSubTask));

        Mockito.verify(subTaskRepository).findById(subTaskId);
        Mockito.verify(subTaskRepository, Mockito.never()).save(Mockito.any(SubTask.class));
    }

    @Test
    void assignTaskToSubTaskShouldAssignTask() {
        // given
        Integer subTaskId = testSubTask.getId();
        Integer taskId = testTask.getId();

        SubTask existingSubTask = new SubTask();
        existingSubTask.setId(subTaskId);
        existingSubTask.setTitle("Test SubTask");
        existingSubTask.setTask(null);  // brak przypisanego zadania

        Task existingTask = new Task();
        existingTask.setId(taskId);
        existingTask.setSubTasks(new ArrayList<>());

        SubTask updatedSubTask = new SubTask();
        updatedSubTask.setId(subTaskId);
        updatedSubTask.setTitle("Test SubTask");
        updatedSubTask.setTask(existingTask);

        SubTaskDTO updatedSubTaskDTO = new SubTaskDTO(
                subTaskId,
                "Test SubTask",
                null,
                false,
                null,
                taskId
        );

        Mockito.when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(existingSubTask));
        Mockito.when(taskRepository.findById(taskId)).thenReturn(Optional.of(existingTask));
        Mockito.when(taskRepository.save(Mockito.any(Task.class))).thenReturn(existingTask);
        Mockito.when(subTaskRepository.save(Mockito.any(SubTask.class))).thenReturn(updatedSubTask);
        Mockito.when(subTaskMapper.toDto(updatedSubTask)).thenReturn(updatedSubTaskDTO);

        // when
        SubTaskDTO result = subTaskService.assignTaskToSubTask(subTaskId, taskId);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(updatedSubTaskDTO.id(), result.id());
        Assertions.assertEquals(updatedSubTaskDTO.taskId(), result.taskId());

        Mockito.verify(subTaskRepository).findById(subTaskId);
        Mockito.verify(taskRepository).findById(taskId);
        Mockito.verify(taskRepository).save(Mockito.any(Task.class));
        Mockito.verify(subTaskRepository).save(Mockito.any(SubTask.class));
        Mockito.verify(subTaskMapper).toDto(updatedSubTask);
    }

    @Test
    void getSubTasksByTaskIdShouldReturnSubTasks() {
        // given
        Integer taskId = testTask.getId();
        testTask.setSubTasks(Arrays.asList(testSubTask));

        Mockito.when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
        Mockito.when(subTaskMapper.toDto(testSubTask)).thenReturn(testSubTaskDTO);

        // when
        List<SubTaskDTO> result = subTaskService.getSubTasksByTaskId(taskId);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals(testSubTaskDTO, result.get(0));

        Mockito.verify(taskRepository).findById(taskId);
        Mockito.verify(subTaskMapper).toDto(testSubTask);
    }

    @Test
    void toggleSubTaskCompletionShouldToggleCompletion() {
        // given
        Integer subTaskId = testSubTask.getId();

        SubTask existingSubTask = new SubTask();
        existingSubTask.setId(subTaskId);
        existingSubTask.setTitle("Test SubTask");
        existingSubTask.setCompleted(false);

        SubTask toggledSubTask = new SubTask();
        toggledSubTask.setId(subTaskId);
        toggledSubTask.setTitle("Test SubTask");
        toggledSubTask.setCompleted(true);

        SubTaskDTO toggledSubTaskDTO = new SubTaskDTO(
                subTaskId,
                "Test SubTask",
                null,
                true,
                null,
                null
        );

        Mockito.when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(existingSubTask));
        Mockito.when(subTaskRepository.save(Mockito.any(SubTask.class))).thenReturn(toggledSubTask);
        Mockito.when(subTaskMapper.toDto(toggledSubTask)).thenReturn(toggledSubTaskDTO);

        // when
        SubTaskDTO result = subTaskService.toggleSubTaskCompletion(subTaskId);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(toggledSubTaskDTO.id(), result.id());
        Assertions.assertEquals(toggledSubTaskDTO.completed(), result.completed());
        Assertions.assertTrue(result.completed());

        Mockito.verify(subTaskRepository).findById(subTaskId);
        Mockito.verify(subTaskRepository).save(Mockito.any(SubTask.class));
        Mockito.verify(subTaskMapper).toDto(toggledSubTask);
    }

    @Test
    void updateSubTaskPositionShouldUpdatePosition() {
        // given
        Integer subTaskId = testSubTask.getId();
        Integer newPosition = 3;

        SubTask existingSubTask = new SubTask();
        existingSubTask.setId(subTaskId);
        existingSubTask.setTitle("Test SubTask");
        existingSubTask.setPosition(1);

        SubTask updatedSubTask = new SubTask();
        updatedSubTask.setId(subTaskId);
        updatedSubTask.setTitle("Test SubTask");
        updatedSubTask.setPosition(newPosition);

        SubTaskDTO updatedSubTaskDTO = new SubTaskDTO(
                subTaskId,
                "Test SubTask",
                null,
                false,
                newPosition,
                null
        );

        Mockito.when(subTaskRepository.findById(subTaskId)).thenReturn(Optional.of(existingSubTask));
        Mockito.when(subTaskRepository.save(Mockito.any(SubTask.class))).thenReturn(updatedSubTask);
        Mockito.when(subTaskMapper.toDto(updatedSubTask)).thenReturn(updatedSubTaskDTO);

        // when
        SubTaskDTO result = subTaskService.updateSubTaskPosition(subTaskId, newPosition);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(updatedSubTaskDTO.id(), result.id());
        Assertions.assertEquals(updatedSubTaskDTO.position(), result.position());
        Assertions.assertEquals(newPosition, result.position());

        Mockito.verify(subTaskRepository).findById(subTaskId);
        Mockito.verify(subTaskRepository).save(Mockito.any(SubTask.class));
        Mockito.verify(subTaskMapper).toDto(updatedSubTask);
    }
}
package pl.myproject.kanbanproject2.mapper;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.myproject.kanbanproject2.dto.SubTaskDTO;
import pl.myproject.kanbanproject2.model.SubTask;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.repository.TaskRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
public class SubTaskMapperTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private SubTaskMapper subTaskMapper;

    private SubTask testSubTask;
    private SubTaskDTO testSubTaskDTO;
    private Task testTask;

    @BeforeEach
    void setUp() {
        testTask = new Task();
        testTask.setId(1);
        testTask.setTitle("Test Task");

        testSubTask = new SubTask();
        testSubTask.setId(1);
        testSubTask.setTitle("Test SubTask");
        testSubTask.setDescription("Test Description");
        testSubTask.setCompleted(false);
        testSubTask.setPosition(2);
        testSubTask.setTask(testTask);

        testSubTaskDTO = new SubTaskDTO(
                1,
                "Test SubTask",
                "Test Description",
                false,
                2,
                1
        );
    }

    @Test
    void shouldMapSubTaskToDTO() {
        // when
        SubTaskDTO result = subTaskMapper.toDto(testSubTask);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testSubTask.getId(), result.id());
        Assertions.assertEquals(testSubTask.getTitle(), result.title());
        Assertions.assertEquals(testSubTask.getDescription(), result.description());
        Assertions.assertEquals(testSubTask.isCompleted(), result.completed());
        Assertions.assertEquals(testSubTask.getPosition(), result.position());
        Assertions.assertEquals(testSubTask.getTask().getId(), result.taskId());
    }

    @Test
    void shouldMapSubTaskToDTOWithNullTask() {
        // given
        testSubTask.setTask(null);

        // when
        SubTaskDTO result = subTaskMapper.toDto(testSubTask);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testSubTask.getId(), result.id());
        Assertions.assertNull(result.taskId());
    }

    @Test
    void shouldReturnNullWhenSubTaskIsNull() {
        // when
        SubTaskDTO result = subTaskMapper.toDto(null);

        // then
        Assertions.assertNull(result);
    }

    @Test
    void shouldMapListOfSubTasksToListOfDTOs() {
        // given
        SubTask anotherSubTask = new SubTask();
        anotherSubTask.setId(2);
        anotherSubTask.setTitle("Another SubTask");
        anotherSubTask.setTask(testTask);

        List<SubTask> subTasks = Arrays.asList(testSubTask, anotherSubTask);

        // when
        List<SubTaskDTO> results = subTaskMapper.toDtoList(subTasks);

        // then
        Assertions.assertEquals(2, results.size());
        Assertions.assertEquals(testSubTask.getId(), results.get(0).id());
        Assertions.assertEquals(anotherSubTask.getId(), results.get(1).id());
    }

    @Test
    void shouldReturnEmptyListWhenSubTaskListIsNull() {
        // when
        List<SubTaskDTO> results = subTaskMapper.toDtoList(null);

        // then
        Assertions.assertNotNull(results);
        Assertions.assertTrue(results.isEmpty());
    }

    @Test
    void shouldMapDTOToSubTask() {
        // given
        Mockito.when(taskRepository.findById(1)).thenReturn(Optional.of(testTask));

        // when
        SubTask result = subTaskMapper.toEntity(testSubTaskDTO);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testSubTaskDTO.id(), result.getId());
        Assertions.assertEquals(testSubTaskDTO.title(), result.getTitle());
        Assertions.assertEquals(testSubTaskDTO.description(), result.getDescription());
        Assertions.assertEquals(testSubTaskDTO.completed(), result.isCompleted());
        Assertions.assertEquals(testSubTaskDTO.position(), result.getPosition());
        Assertions.assertEquals(testTask, result.getTask());

        Mockito.verify(taskRepository).findById(1);
    }

    @Test
    void shouldMapDTOToSubTaskWithNullTaskId() {
        // given
        SubTaskDTO dtoWithNullTaskId = new SubTaskDTO(
                1,
                "Test SubTask",
                "Test Description",
                false,
                2,
                null
        );

        // when
        SubTask result = subTaskMapper.toEntity(dtoWithNullTaskId);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(dtoWithNullTaskId.id(), result.getId());
        Assertions.assertNull(result.getTask());
    }

    @Test
    void shouldReturnNullWhenDTOIsNull() {
        // when
        SubTask result = subTaskMapper.toEntity(null);

        // then
        Assertions.assertNull(result);
    }

    @Test
    void shouldMapListOfDTOsToListOfEntities() {
        // given
        SubTaskDTO anotherDTO = new SubTaskDTO(2, "Another SubTask", "Another Description", true, 3, 1);
        List<SubTaskDTO> dtos = Arrays.asList(testSubTaskDTO, anotherDTO);

        Mockito.when(taskRepository.findById(1)).thenReturn(Optional.of(testTask));

        // when
        List<SubTask> results = subTaskMapper.toEntityList(dtos);

        // then
        Assertions.assertEquals(2, results.size());
        Assertions.assertEquals(testSubTaskDTO.id(), results.get(0).getId());
        Assertions.assertEquals(anotherDTO.id(), results.get(1).getId());
    }

    @Test
    void shouldUpdateEntityFromDTO() {
        // given
        SubTask entityToUpdate = new SubTask();
        entityToUpdate.setId(1);
        entityToUpdate.setTitle("Old Title");
        entityToUpdate.setDescription("Old Description");
        entityToUpdate.setCompleted(true);
        entityToUpdate.setPosition(1);
        entityToUpdate.setTask(null);

        SubTaskDTO updateDTO = new SubTaskDTO(
                1,
                "New Title",
                "New Description",
                false,
                3,
                1
        );

        Mockito.when(taskRepository.findById(1)).thenReturn(Optional.of(testTask));

        // when
        subTaskMapper.updateEntityFromDto(updateDTO, entityToUpdate);

        // then
        Assertions.assertEquals(updateDTO.title(), entityToUpdate.getTitle());
        Assertions.assertEquals(updateDTO.description(), entityToUpdate.getDescription());
        Assertions.assertEquals(updateDTO.completed(), entityToUpdate.isCompleted());
        Assertions.assertEquals(updateDTO.position(), entityToUpdate.getPosition());
        Assertions.assertEquals(testTask, entityToUpdate.getTask());

        Mockito.verify(taskRepository).findById(1);
    }

    @Test
    void shouldNotUpdateEntityWhenDTOIsNull() {
        // given
        SubTask entityToUpdate = new SubTask();
        entityToUpdate.setTitle("Original Title");

        // when
        subTaskMapper.updateEntityFromDto(null, entityToUpdate);

        // then
        Assertions.assertEquals("Original Title", entityToUpdate.getTitle());
    }

    @Test
    void shouldNotUpdateEntityWhenEntityIsNull() {
        // when & then (no exception should be thrown)
        subTaskMapper.updateEntityFromDto(testSubTaskDTO, null);
    }

    @Test
    void shouldNotUpdateTaskRelationWhenTaskIdIsTheSame() {
        // given
        SubTask entityToUpdate = new SubTask();
        entityToUpdate.setTask(testTask);

        SubTaskDTO updateDTO = new SubTaskDTO(
                1,
                "New Title",
                "New Description",
                false,
                3,
                1  // Same task ID as the one already set
        );

        // when
        subTaskMapper.updateEntityFromDto(updateDTO, entityToUpdate);

        // then
        Assertions.assertEquals(testTask, entityToUpdate.getTask());
        // Verify that we didn't query the repository
        Mockito.verifyNoInteractions(taskRepository);
    }
}
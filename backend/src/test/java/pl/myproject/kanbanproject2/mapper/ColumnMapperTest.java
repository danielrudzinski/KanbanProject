package pl.myproject.kanbanproject2.mapper;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.myproject.kanbanproject2.dto.ColumnDTO;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.model.Task;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

@ExtendWith(MockitoExtension.class)
public class ColumnMapperTest {

    @Mock
    private TaskMapper taskMapper;

    @InjectMocks
    private ColumnMapper columnMapper;

    private Column testColumn;
    private Task testTask;
    private TaskDTO testTaskDTO;

    @BeforeEach
    void setUp() {
        testTask = new Task();
        testTask.setId(1);
        testTask.setTitle("Test Task");
        testTask.setPosition(1);
        testTask.setCompleted(false);
        testTask.setDescription("Test Description");
        testTask.setLabels(new HashSet<>());

        testTaskDTO = new TaskDTO(1, "Test Task", 1, null, null, null, new HashSet<>(), false, "Test Description");

        testColumn = new Column();
        testColumn.setId(1);
        testColumn.setName("Test Column");
        testColumn.setPosition(1);
        testColumn.setWipLimit(5);
        testColumn.setTasks(List.of(testTask));
    }

    @Test
    void shouldMapColumnToColumnDTO() {
        // given
        Mockito.when(taskMapper.apply(testTask)).thenReturn(testTaskDTO);

        // when
        ColumnDTO result = columnMapper.apply(testColumn);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testColumn.getId(), result.id());
        Assertions.assertEquals(testColumn.getName(), result.name());
        Assertions.assertEquals(testColumn.getPosition(), result.position());
        Assertions.assertEquals(testColumn.getWipLimit(), result.wipLimit());
        Assertions.assertEquals(1, result.taskDTO().size());
        Assertions.assertEquals(testTaskDTO, result.taskDTO().get(0));

        Mockito.verify(taskMapper).apply(testTask);
    }

    @Test
    void shouldReturnNullWhenColumnIsNull() {
        // when
        ColumnDTO result = columnMapper.apply(null);

        // then
        Assertions.assertNull(result);
    }

    @Test
    void shouldHandleEmptyTasksList() {
        // given
        Column columnWithNoTasks = new Column();
        columnWithNoTasks.setId(2);
        columnWithNoTasks.setName("Empty Column");
        columnWithNoTasks.setPosition(2);
        columnWithNoTasks.setWipLimit(3);
        columnWithNoTasks.setTasks(new ArrayList<>());

        // when
        ColumnDTO result = columnMapper.apply(columnWithNoTasks);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(columnWithNoTasks.getId(), result.id());
        Assertions.assertEquals(columnWithNoTasks.getName(), result.name());
        Assertions.assertEquals(columnWithNoTasks.getPosition(), result.position());
        Assertions.assertEquals(columnWithNoTasks.getWipLimit(), result.wipLimit());
        Assertions.assertTrue(result.taskDTO().isEmpty());
    }
}
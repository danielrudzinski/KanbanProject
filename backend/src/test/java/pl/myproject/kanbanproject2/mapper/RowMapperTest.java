package pl.myproject.kanbanproject2.mapper;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.myproject.kanbanproject2.dto.RowDTO;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Row;
import pl.myproject.kanbanproject2.model.Task;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

@ExtendWith(MockitoExtension.class)
public class RowMapperTest {

    @Mock
    private TaskMapper taskMapper;

    @InjectMocks
    private RowMapper rowMapper;

    private Row testRow;
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

        testRow = new Row();
        testRow.setId(1);
        testRow.setName("Test Row");
        testRow.setPosition(1);
        testRow.setWipLimit(5);
        testRow.setTasks(List.of(testTask));
    }

    @Test
    void shouldMapRowToRowDTO() {
        // given
        Mockito.when(taskMapper.apply(testTask)).thenReturn(testTaskDTO);

        // when
        RowDTO result = rowMapper.apply(testRow);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testRow.getId(), result.id());
        Assertions.assertEquals(testRow.getName(), result.name());
        Assertions.assertEquals(testRow.getPosition(), result.position());
        Assertions.assertEquals(testRow.getWipLimit(), result.wipLimit());
        Assertions.assertEquals(1, result.taskDTO().size());
        Assertions.assertEquals(testTaskDTO, result.taskDTO().get(0));

        Mockito.verify(taskMapper).apply(testTask);
    }

    @Test
    void shouldReturnNullWhenRowIsNull() {
        // when
        RowDTO result = rowMapper.apply(null);

        // then
        Assertions.assertNull(result);
    }

    @Test
    void shouldHandleEmptyTasksList() {
        // given
        Row rowWithNoTasks = new Row();
        rowWithNoTasks.setId(2);
        rowWithNoTasks.setName("Empty Row");
        rowWithNoTasks.setPosition(2);
        rowWithNoTasks.setWipLimit(3);
        rowWithNoTasks.setTasks(new ArrayList<>());

        // when
        RowDTO result = rowMapper.apply(rowWithNoTasks);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(rowWithNoTasks.getId(), result.id());
        Assertions.assertEquals(rowWithNoTasks.getName(), result.name());
        Assertions.assertEquals(rowWithNoTasks.getPosition(), result.position());
        Assertions.assertEquals(rowWithNoTasks.getWipLimit(), result.wipLimit());
        Assertions.assertTrue(result.taskDTO().isEmpty());
    }
}
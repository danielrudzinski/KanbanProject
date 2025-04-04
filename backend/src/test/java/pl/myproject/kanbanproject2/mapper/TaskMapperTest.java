package pl.myproject.kanbanproject2.mapper;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.model.Row;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;

import java.util.HashSet;
import java.util.Set;

@ExtendWith(MockitoExtension.class)
public class TaskMapperTest {

    @InjectMocks
    private TaskMapper taskMapper;

    private Task testTask;
    private Column testColumn;
    private Row testRow;
    private User testUser1;
    private User testUser2;

    @BeforeEach
    void setUp() {
        testColumn = new Column();
        testColumn.setId(1);
        testColumn.setName("Test Column");

        testRow = new Row();
        testRow.setId(2);
        testRow.setName("Test Row");

        testUser1 = new User();
        testUser1.setId(1);
        testUser1.setName("User 1");
        testUser1.setEmail("user1@example.com");

        testUser2 = new User();
        testUser2.setId(2);
        testUser2.setName("User 2");
        testUser2.setEmail("user2@example.com");

        Set<String> labels = new HashSet<>();
        labels.add("urgent");
        labels.add("bug");

        testTask = new Task();
        testTask.setId(1);
        testTask.setTitle("Test Task");
        testTask.setPosition(3);
        testTask.setColumn(testColumn);
        testTask.setRow(testRow);
        testTask.setUsers(Set.of(testUser1, testUser2));
        testTask.setLabels(labels);
        testTask.setCompleted(false);
        testTask.setDescription("Test Description");
    }

    @Test
    void shouldMapTaskToTaskDTO() {
        // when
        TaskDTO result = taskMapper.apply(testTask);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testTask.getId(), result.id());
        Assertions.assertEquals(testTask.getTitle(), result.title());
        Assertions.assertEquals(testTask.getPosition(), result.position());
        Assertions.assertEquals(testTask.getColumn().getId(), result.columnId());
        Assertions.assertEquals(testTask.getRow().getId(), result.rowId());
        Assertions.assertEquals(testTask.isCompleted(), result.completed());
        Assertions.assertEquals(testTask.getDescription(), result.description());

        // Check users
        Assertions.assertNotNull(result.userIds());
        Assertions.assertEquals(2, result.userIds().size());
        Assertions.assertTrue(result.userIds().contains(1));
        Assertions.assertTrue(result.userIds().contains(2));

        // Check labels
        Assertions.assertNotNull(result.labels());
        Assertions.assertEquals(2, result.labels().size());
        Assertions.assertTrue(result.labels().contains("urgent"));
        Assertions.assertTrue(result.labels().contains("bug"));
    }

    @Test
    void shouldReturnNullWhenTaskIsNull() {
        // when
        TaskDTO result = taskMapper.apply(null);

        // then
        Assertions.assertNull(result);
    }

    @Test
    void shouldHandleNullColumn() {
        // given
        testTask.setColumn(null);

        // when
        TaskDTO result = taskMapper.apply(testTask);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertNull(result.columnId());
    }

    @Test
    void shouldHandleNullRow() {
        // given
        testTask.setRow(null);

        // when
        TaskDTO result = taskMapper.apply(testTask);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertNull(result.rowId());
    }

    @Test
    void shouldHandleNullUsers() {
        // given
        testTask.setUsers(null);

        // when
        TaskDTO result = taskMapper.apply(testTask);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertNull(result.userIds());
    }

    @Test
    void shouldHandleEmptyUsers() {
        // given
        testTask.setUsers(new HashSet<>());

        // when
        TaskDTO result = taskMapper.apply(testTask);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertNotNull(result.userIds());
        Assertions.assertTrue(result.userIds().isEmpty());
    }
}
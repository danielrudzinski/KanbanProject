package pl.myproject.kanbanproject2.mapper;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;

import java.util.HashSet;
import java.util.Set;

@ExtendWith(MockitoExtension.class)
public class UserMapperTest {

    @Mock
    private TaskMapper taskMapper;

    @InjectMocks
    private UserMapper userMapper;

    private User testUser;
    private Task testTask1;
    private Task testTask2;
    private TaskDTO testTaskDTO1;
    private TaskDTO testTaskDTO2;

    @BeforeEach
    void setUp() {
        testTask1 = new Task();
        testTask1.setId(1);
        testTask1.setTitle("Test Task 1");
        testTask1.setLabels(new HashSet<>());

        testTask2 = new Task();
        testTask2.setId(2);
        testTask2.setTitle("Test Task 2");
        testTask2.setLabels(new HashSet<>());

        testTaskDTO1 = new TaskDTO(1, "Test Task 1", 1, null, null, null, new HashSet<>(), false, "Description 1");
        testTaskDTO2 = new TaskDTO(2, "Test Task 2", 2, null, null, null, new HashSet<>(), false, "Description 2");

        testUser = new User();
        testUser.setId(1);
        testUser.setName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setWipLimit(5);
        testUser.setTasks(Set.of(testTask1, testTask2));
    }

    @Test
    void shouldMapUserToUserDTO() {
        // given
        Mockito.when(taskMapper.apply(testTask1)).thenReturn(testTaskDTO1);
        Mockito.when(taskMapper.apply(testTask2)).thenReturn(testTaskDTO2);

        // when
        UserDTO result = userMapper.apply(testUser);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testUser.getId(), result.id());
        Assertions.assertEquals(testUser.getName(), result.name());
        Assertions.assertEquals(testUser.getEmail(), result.email());
        Assertions.assertEquals(testUser.getWipLimit(), result.wipLimit());

        Assertions.assertEquals(2, result.tasks().size());
        Assertions.assertTrue(result.tasks().contains(testTaskDTO1));
        Assertions.assertTrue(result.tasks().contains(testTaskDTO2));

        Mockito.verify(taskMapper).apply(testTask1);
        Mockito.verify(taskMapper).apply(testTask2);
    }

    @Test
    void shouldReturnNullWhenUserIsNull() {
        // when
        UserDTO result = userMapper.apply(null);

        // then
        Assertions.assertNull(result);
    }

    @Test
    void shouldHandleEmptyTasksSet() {
        // given
        User userWithNoTasks = new User();
        userWithNoTasks.setId(2);
        userWithNoTasks.setName("User No Tasks");
        userWithNoTasks.setEmail("notasks@example.com");
        userWithNoTasks.setWipLimit(3);
        userWithNoTasks.setTasks(new HashSet<>());

        // when
        UserDTO result = userMapper.apply(userWithNoTasks);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(userWithNoTasks.getId(), result.id());
        Assertions.assertEquals(userWithNoTasks.getName(), result.name());
        Assertions.assertEquals(userWithNoTasks.getEmail(), result.email());
        Assertions.assertEquals(userWithNoTasks.getWipLimit(), result.wipLimit());
        Assertions.assertTrue(result.tasks().isEmpty());
    }
}
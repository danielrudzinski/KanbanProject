package pl.myproject.kanbanproject2.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import pl.myproject.kanbanproject2.dto.TaskDTO;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.model.Row;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.service.TaskService;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@ExtendWith(MockitoExtension.class)
public class TaskControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TaskService taskService;

    @InjectMocks
    private TaskController taskController;

    private ObjectMapper objectMapper;
    private Task testTask;
    private TaskDTO testTaskDTO;
    private Set<String> testLabels;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(taskController).build();
        objectMapper = new ObjectMapper();

        // Setup test data
        testTask = new Task();
        testTask.setId(1);
        testTask.setTitle("Test Task");
        testTask.setPosition(1);
        testTask.setCompleted(false);
        testTask.setDescription("Test Description");

        Column column = new Column();
        column.setId(1);
        testTask.setColumn(column);

        Row row = new Row();
        row.setId(1);
        testTask.setRow(row);

        testLabels = new HashSet<>();
        testLabels.add("urgent");
        testLabels.add("frontend");
        testTask.setLabels(testLabels);

        testTask.setUsers(new HashSet<>());

        testTaskDTO = new TaskDTO(
                1,
                "Test Task",
                1,
                1,
                1,
                new HashSet<>(),
                testLabels,
                false,
                "Test Description"
        );
    }

    @AfterEach
    void tearDown() {
        testTask = null;
        testTaskDTO = null;
        testLabels = null;
    }

    @Test
    void getAllTasksShouldReturnListOfTasks() throws Exception {
        // given
        List<TaskDTO> tasks = Arrays.asList(testTaskDTO);
        Mockito.when(taskService.getAllTasks()).thenReturn(tasks);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/tasks")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        List<TaskDTO> returnedTasks = objectMapper.readValue(content,
                objectMapper.getTypeFactory().constructCollectionType(List.class, TaskDTO.class));

        Assertions.assertEquals(1, returnedTasks.size());
        Assertions.assertEquals(testTaskDTO.id(), returnedTasks.get(0).id());
        Assertions.assertEquals(testTaskDTO.title(), returnedTasks.get(0).title());
        Assertions.assertEquals(testTaskDTO.position(), returnedTasks.get(0).position());
        Assertions.assertEquals(testTaskDTO.description(), returnedTasks.get(0).description());

        Mockito.verify(taskService).getAllTasks();
    }

    @Test
    void getTaskByIdShouldReturnTask() throws Exception {
        // given
        Mockito.when(taskService.getTaskById(1)).thenReturn(testTaskDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/tasks/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        TaskDTO returnedTask = objectMapper.readValue(content, TaskDTO.class);

        Assertions.assertEquals(testTaskDTO.id(), returnedTask.id());
        Assertions.assertEquals(testTaskDTO.title(), returnedTask.title());
        Assertions.assertEquals(testTaskDTO.position(), returnedTask.position());
        Assertions.assertEquals(testTaskDTO.description(), returnedTask.description());

        Mockito.verify(taskService).getTaskById(1);
    }



    @Test
    void createTaskShouldReturnCreatedTask() throws Exception {
        // given
        Mockito.when(taskService.addTask(Mockito.any(Task.class))).thenReturn(testTask);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testTask)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        Task returnedTask = objectMapper.readValue(content, Task.class);

        Assertions.assertEquals(testTask.getId(), returnedTask.getId());
        Assertions.assertEquals(testTask.getTitle(), returnedTask.getTitle());
        Assertions.assertEquals(testTask.getPosition(), returnedTask.getPosition());
        Assertions.assertEquals(testTask.getDescription(), returnedTask.getDescription());

        Mockito.verify(taskService).addTask(Mockito.any(Task.class));
    }

    @Test
    void patchTaskShouldReturnUpdatedTask() throws Exception {
        // given
        Task updateTask = new Task();
        updateTask.setTitle("Updated Task");
        updateTask.setDescription("Updated Description");

        TaskDTO updatedTaskDTO = new TaskDTO(
                1,
                "Updated Task",
                1,
                1,
                1,
                new HashSet<>(),
                testLabels,
                false,
                "Updated Description"
        );

        Mockito.when(taskService.patchTask(Mockito.eq(1), Mockito.any(Task.class))).thenReturn(updatedTaskDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.patch("/tasks/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateTask)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        TaskDTO returnedTask = objectMapper.readValue(content, TaskDTO.class);

        Assertions.assertEquals(updatedTaskDTO.id(), returnedTask.id());
        Assertions.assertEquals(updatedTaskDTO.title(), returnedTask.title());
        Assertions.assertEquals(updatedTaskDTO.description(), returnedTask.description());

        Mockito.verify(taskService).patchTask(Mockito.eq(1), Mockito.any(Task.class));
    }



    @Test
    void deleteTaskShouldReturnNoContent() throws Exception {
        // given
        Mockito.doNothing().when(taskService).deleteTask(1);

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.delete("/tasks/1"))
                .andExpect(MockMvcResultMatchers.status().isNoContent());

        Mockito.verify(taskService).deleteTask(1);
    }



    @Test
    void assignUserToTaskShouldReturnUpdatedTask() throws Exception {
        // given
        Mockito.when(taskService.assignUserToTask(1, 2)).thenReturn(testTaskDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.put("/tasks/1/user/2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        TaskDTO returnedTask = objectMapper.readValue(content, TaskDTO.class);

        Assertions.assertEquals(testTaskDTO.id(), returnedTask.id());
        Assertions.assertEquals(testTaskDTO.title(), returnedTask.title());

        Mockito.verify(taskService).assignUserToTask(1, 2);
    }

    @Test
    void removeUserFromTaskShouldReturnUpdatedTask() throws Exception {
        // given
        Mockito.when(taskService.removeUserFromTask(1, 2)).thenReturn(testTaskDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.delete("/tasks/1/user/2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        TaskDTO returnedTask = objectMapper.readValue(content, TaskDTO.class);

        Assertions.assertEquals(testTaskDTO.id(), returnedTask.id());
        Assertions.assertEquals(testTaskDTO.title(), returnedTask.title());

        Mockito.verify(taskService).removeUserFromTask(1, 2);
    }

    @Test
    void updateTaskPositionShouldReturnUpdatedTask() throws Exception {
        // given
        TaskDTO updatedTaskDTO = new TaskDTO(
                1,
                "Test Task",
                3, // Updated position
                1,
                1,
                new HashSet<>(),
                testLabels,
                false,
                "Test Description"
        );

        Mockito.when(taskService.updateTaskPosition(1, 3)).thenReturn(updatedTaskDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.patch("/tasks/1/position/3")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        TaskDTO returnedTask = objectMapper.readValue(content, TaskDTO.class);

        Assertions.assertEquals(updatedTaskDTO.id(), returnedTask.id());
        Assertions.assertEquals(updatedTaskDTO.position(), returnedTask.position());

        Mockito.verify(taskService).updateTaskPosition(1, 3);
    }

    @Test
    void addLabelToTaskShouldReturnUpdatedTask() throws Exception {
        // given
        Mockito.when(taskService.addLabelToTask(1, "bug")).thenReturn(testTaskDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.put("/tasks/1/label/bug")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        TaskDTO returnedTask = objectMapper.readValue(content, TaskDTO.class);

        Assertions.assertEquals(testTaskDTO.id(), returnedTask.id());
        Assertions.assertEquals(testTaskDTO.labels(), returnedTask.labels());

        Mockito.verify(taskService).addLabelToTask(1, "bug");
    }

    @Test
    void removeLabelFromTaskShouldReturnUpdatedTask() throws Exception {
        // given
        Mockito.when(taskService.removeLabelFromTask(1, "urgent")).thenReturn(testTaskDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.delete("/tasks/1/label/urgent")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        TaskDTO returnedTask = objectMapper.readValue(content, TaskDTO.class);

        Assertions.assertEquals(testTaskDTO.id(), returnedTask.id());
        Assertions.assertEquals(testTaskDTO.labels(), returnedTask.labels());

        Mockito.verify(taskService).removeLabelFromTask(1, "urgent");
    }

    @Test
    void updateTaskLabelsShouldReturnUpdatedTask() throws Exception {
        // given
        Set<String> newLabels = new HashSet<>();
        newLabels.add("backend");
        newLabels.add("critical");

        TaskDTO updatedTaskDTO = new TaskDTO(
                1,
                "Test Task",
                1,
                1,
                1,
                new HashSet<>(),
                newLabels,
                false,
                "Test Description"
        );

        Mockito.when(taskService.updateTaskLabels(Mockito.eq(1), Mockito.any(Set.class))).thenReturn(updatedTaskDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.patch("/tasks/1/labels")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLabels)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        TaskDTO returnedTask = objectMapper.readValue(content, TaskDTO.class);

        Assertions.assertEquals(updatedTaskDTO.id(), returnedTask.id());
        Assertions.assertEquals(updatedTaskDTO.labels(), returnedTask.labels());

        Mockito.verify(taskService).updateTaskLabels(Mockito.eq(1), Mockito.any(Set.class));
    }

    @Test
    void getAllLabelsShouldReturnSetOfLabels() throws Exception {
        // given
        Set<String> allLabels = new HashSet<>(Arrays.asList("urgent", "frontend", "backend", "bug"));
        Mockito.when(taskService.getAllLabels()).thenReturn(allLabels);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/tasks/get/all/labels")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        Set<String> returnedLabels = objectMapper.readValue(content,
                objectMapper.getTypeFactory().constructCollectionType(Set.class, String.class));

        Assertions.assertEquals(4, returnedLabels.size());
        Assertions.assertTrue(returnedLabels.contains("urgent"));
        Assertions.assertTrue(returnedLabels.contains("frontend"));
        Assertions.assertTrue(returnedLabels.contains("backend"));
        Assertions.assertTrue(returnedLabels.contains("bug"));

        Mockito.verify(taskService).getAllLabels();
    }
}
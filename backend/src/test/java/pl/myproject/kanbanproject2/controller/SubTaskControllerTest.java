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
import pl.myproject.kanbanproject2.dto.SubTaskDTO;
import pl.myproject.kanbanproject2.model.SubTask;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.service.SubTaskService;

import java.util.Arrays;
import java.util.List;

@ExtendWith(MockitoExtension.class)
public class SubTaskControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SubTaskService subTaskService;

    @InjectMocks
    private SubTaskController subTaskController;

    private ObjectMapper objectMapper;
    private SubTask testSubTask;
    private SubTaskDTO testSubTaskDTO;
    private Task testTask;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(subTaskController).build();
        objectMapper = new ObjectMapper();

        testTask = new Task();
        testTask.setId(1);
        testTask.setTitle("Test Task");

        testSubTask = new SubTask();
        testSubTask.setId(1);
        testSubTask.setTitle("Test SubTask");
        testSubTask.setDescription("Test Description");
        testSubTask.setCompleted(false);
        testSubTask.setPosition(1);
        testSubTask.setTask(testTask);

        testSubTaskDTO = new SubTaskDTO(1, "Test SubTask", "Test Description", false, 1, 1);
    }

    @AfterEach
    void tearDown() {
        testTask = null;
        testSubTask = null;
        testSubTaskDTO = null;
    }

    @Test
    void getAllSubTasksShouldReturnListOfSubTasks() throws Exception {
        // given
        List<SubTaskDTO> subTasks = Arrays.asList(testSubTaskDTO);
        Mockito.when(subTaskService.getAllSubTasks()).thenReturn(subTasks);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/subtasks")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        List<SubTaskDTO> returnedSubTasks = objectMapper.readValue(content,
                objectMapper.getTypeFactory().constructCollectionType(List.class, SubTaskDTO.class));

        Assertions.assertEquals(1, returnedSubTasks.size());
        Assertions.assertEquals(testSubTaskDTO.id(), returnedSubTasks.get(0).id());
        Assertions.assertEquals(testSubTaskDTO.title(), returnedSubTasks.get(0).title());
        Assertions.assertEquals(testSubTaskDTO.description(), returnedSubTasks.get(0).description());
        Assertions.assertEquals(testSubTaskDTO.completed(), returnedSubTasks.get(0).completed());
        Assertions.assertEquals(testSubTaskDTO.position(), returnedSubTasks.get(0).position());
        Assertions.assertEquals(testSubTaskDTO.taskId(), returnedSubTasks.get(0).taskId());

        Mockito.verify(subTaskService).getAllSubTasks();
    }

    @Test
    void getSubTaskByIdShouldReturnSubTask() throws Exception {
        // given
        Mockito.when(subTaskService.getSubTaskById(1)).thenReturn(testSubTaskDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/subtasks/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        SubTaskDTO returnedSubTask = objectMapper.readValue(content, SubTaskDTO.class);

        Assertions.assertEquals(testSubTaskDTO.id(), returnedSubTask.id());
        Assertions.assertEquals(testSubTaskDTO.title(), returnedSubTask.title());
        Assertions.assertEquals(testSubTaskDTO.description(), returnedSubTask.description());
        Assertions.assertEquals(testSubTaskDTO.completed(), returnedSubTask.completed());
        Assertions.assertEquals(testSubTaskDTO.position(), returnedSubTask.position());
        Assertions.assertEquals(testSubTaskDTO.taskId(), returnedSubTask.taskId());

        Mockito.verify(subTaskService).getSubTaskById(1);
    }

    @Test
    void getSubTaskByIdShouldReturnNotFoundWhenSubTaskDoesNotExist() throws Exception {
        // given
        Mockito.when(subTaskService.getSubTaskById(999)).thenThrow(new EntityNotFoundException("Nie ma podzadania o takim id"));

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.get("/subtasks/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNotFound());

        Mockito.verify(subTaskService).getSubTaskById(999);
    }

    @Test
    void createSubTaskShouldReturnCreatedSubTask() throws Exception {
        // given
        Mockito.when(subTaskService.addSubTask(Mockito.any(SubTask.class))).thenReturn(testSubTask);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/subtasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testSubTask)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        SubTask returnedSubTask = objectMapper.readValue(content, SubTask.class);

        Assertions.assertEquals(testSubTask.getId(), returnedSubTask.getId());
        Assertions.assertEquals(testSubTask.getTitle(), returnedSubTask.getTitle());
        Assertions.assertEquals(testSubTask.getDescription(), returnedSubTask.getDescription());
        Assertions.assertEquals(testSubTask.isCompleted(), returnedSubTask.isCompleted());
        Assertions.assertEquals(testSubTask.getPosition(), returnedSubTask.getPosition());

        Mockito.verify(subTaskService).addSubTask(Mockito.any(SubTask.class));
    }

    @Test
    void patchSubTaskShouldReturnUpdatedSubTask() throws Exception {
        // given
        SubTask updateSubTask = new SubTask();
        updateSubTask.setTitle("Updated SubTask");
        updateSubTask.setDescription("Updated Description");

        SubTaskDTO updatedDTO = new SubTaskDTO(1, "Updated SubTask", "Updated Description", false, 1, 1);

        Mockito.when(subTaskService.patchSubTask(Mockito.eq(1), Mockito.any(SubTask.class))).thenReturn(updatedDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.patch("/subtasks/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateSubTask)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        SubTaskDTO returnedSubTask = objectMapper.readValue(content, SubTaskDTO.class);

        Assertions.assertEquals(updatedDTO.id(), returnedSubTask.id());
        Assertions.assertEquals(updatedDTO.title(), returnedSubTask.title());
        Assertions.assertEquals(updatedDTO.description(), returnedSubTask.description());
        Assertions.assertEquals(updatedDTO.completed(), returnedSubTask.completed());
        Assertions.assertEquals(updatedDTO.position(), returnedSubTask.position());
        Assertions.assertEquals(updatedDTO.taskId(), returnedSubTask.taskId());

        Mockito.verify(subTaskService).patchSubTask(Mockito.eq(1), Mockito.any(SubTask.class));
    }

    @Test
    void deleteSubTaskShouldReturnNoContent() throws Exception {
        // given
        Mockito.doNothing().when(subTaskService).deleteSubTask(1);

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.delete("/subtasks/1"))
                .andExpect(MockMvcResultMatchers.status().isNoContent());

        Mockito.verify(subTaskService).deleteSubTask(1);
    }

    @Test
    void assignTaskToSubTaskShouldReturnUpdatedSubTask() throws Exception {
        // given
        Mockito.when(subTaskService.assignTaskToSubTask(1, 2)).thenReturn(testSubTaskDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.put("/subtasks/1/task/2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        SubTaskDTO returnedSubTask = objectMapper.readValue(content, SubTaskDTO.class);

        Assertions.assertEquals(testSubTaskDTO.id(), returnedSubTask.id());
        Assertions.assertEquals(testSubTaskDTO.title(), returnedSubTask.title());
        Assertions.assertEquals(testSubTaskDTO.description(), returnedSubTask.description());
        Assertions.assertEquals(testSubTaskDTO.completed(), returnedSubTask.completed());
        Assertions.assertEquals(testSubTaskDTO.position(), returnedSubTask.position());
        Assertions.assertEquals(testSubTaskDTO.taskId(), returnedSubTask.taskId());

        Mockito.verify(subTaskService).assignTaskToSubTask(1, 2);
    }

    @Test
    void getSubTasksByTaskIdShouldReturnListOfSubTasks() throws Exception {
        // given
        List<SubTaskDTO> subTasks = Arrays.asList(testSubTaskDTO);
        Mockito.when(subTaskService.getSubTasksByTaskId(1)).thenReturn(subTasks);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/subtasks/task/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        List<SubTaskDTO> returnedSubTasks = objectMapper.readValue(content,
                objectMapper.getTypeFactory().constructCollectionType(List.class, SubTaskDTO.class));

        Assertions.assertEquals(1, returnedSubTasks.size());
        Assertions.assertEquals(testSubTaskDTO.id(), returnedSubTasks.get(0).id());

        Mockito.verify(subTaskService).getSubTasksByTaskId(1);
    }

    @Test
    void toggleSubTaskCompletionShouldReturnUpdatedSubTask() throws Exception {
        // given
        SubTaskDTO toggledDTO = new SubTaskDTO(1, "Test SubTask", "Test Description", true, 1, 1);
        Mockito.when(subTaskService.toggleSubTaskCompletion(1)).thenReturn(toggledDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.patch("/subtasks/1/change")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        SubTaskDTO returnedSubTask = objectMapper.readValue(content, SubTaskDTO.class);

        Assertions.assertEquals(toggledDTO.id(), returnedSubTask.id());
        Assertions.assertEquals(toggledDTO.completed(), returnedSubTask.completed());

        Mockito.verify(subTaskService).toggleSubTaskCompletion(1);
    }

    @Test
    void updateSubTaskPositionShouldReturnUpdatedSubTask() throws Exception {
        // given
        SubTaskDTO positionUpdatedDTO = new SubTaskDTO(1, "Test SubTask", "Test Description", false, 3, 1);
        Mockito.when(subTaskService.updateSubTaskPosition(1, 3)).thenReturn(positionUpdatedDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.patch("/subtasks/1/position/3")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        SubTaskDTO returnedSubTask = objectMapper.readValue(content, SubTaskDTO.class);

        Assertions.assertEquals(positionUpdatedDTO.id(), returnedSubTask.id());
        Assertions.assertEquals(positionUpdatedDTO.position(), returnedSubTask.position());

        Mockito.verify(subTaskService).updateSubTaskPosition(1, 3);
    }
}
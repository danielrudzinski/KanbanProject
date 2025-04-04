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
import pl.myproject.kanbanproject2.dto.ColumnDTO;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.service.ColumnService;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@ExtendWith(MockitoExtension.class)
public class ColumnControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ColumnService columnService;

    @InjectMocks
    private ColumnController columnController;

    private ObjectMapper objectMapper;
    private Column testColumn;
    private ColumnDTO testColumnDTO;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(columnController).build();
        objectMapper = new ObjectMapper();

        testColumn = new Column();
        testColumn.setId(1);
        testColumn.setName("Test Column");
        testColumn.setPosition(1);
        testColumn.setWipLimit(5);

        testColumnDTO = new ColumnDTO(1, "Test Column", 1, 5, new ArrayList<>());
    }

    @AfterEach
    void tearDown() {
        testColumn = null;
        testColumnDTO = null;
    }

    @Test
    void getAllColumnsShouldReturnListOfColumns() throws Exception {
        // given
        List<ColumnDTO> columns = Arrays.asList(testColumnDTO);
        Mockito.when(columnService.getAllColumns()).thenReturn(columns);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/columns")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        List<ColumnDTO> returnedColumns = objectMapper.readValue(content,
                objectMapper.getTypeFactory().constructCollectionType(List.class, ColumnDTO.class));

        Assertions.assertEquals(1, returnedColumns.size());
        Assertions.assertEquals(testColumnDTO.id(), returnedColumns.get(0).id());
        Assertions.assertEquals(testColumnDTO.name(), returnedColumns.get(0).name());
        Assertions.assertEquals(testColumnDTO.position(), returnedColumns.get(0).position());
        Assertions.assertEquals(testColumnDTO.wipLimit(), returnedColumns.get(0).wipLimit());

        Mockito.verify(columnService).getAllColumns();
    }

    @Test
    void getColumnByIdShouldReturnColumn() throws Exception {
        // given
        Mockito.when(columnService.getColumnById(1)).thenReturn(testColumnDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/columns/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        ColumnDTO returnedColumn = objectMapper.readValue(content, ColumnDTO.class);

        Assertions.assertEquals(testColumnDTO.id(), returnedColumn.id());
        Assertions.assertEquals(testColumnDTO.name(), returnedColumn.name());
        Assertions.assertEquals(testColumnDTO.position(), returnedColumn.position());
        Assertions.assertEquals(testColumnDTO.wipLimit(), returnedColumn.wipLimit());

        Mockito.verify(columnService).getColumnById(1);
    }

    @Test
    void createColumnShouldReturnCreatedColumn() throws Exception {
        // given
        Mockito.when(columnService.addNewColumn(Mockito.any(Column.class))).thenReturn(testColumn);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/columns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testColumn)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        Column returnedColumn = objectMapper.readValue(content, Column.class);

        Assertions.assertEquals(testColumn.getId(), returnedColumn.getId());
        Assertions.assertEquals(testColumn.getName(), returnedColumn.getName());
        Assertions.assertEquals(testColumn.getPosition(), returnedColumn.getPosition());
        Assertions.assertEquals(testColumn.getWipLimit(), returnedColumn.getWipLimit());

        Mockito.verify(columnService).addNewColumn(Mockito.any(Column.class));
    }

    @Test
    void updateColumnShouldReturnUpdatedColumn() throws Exception {
        // given
        ColumnDTO updateDTO = new ColumnDTO(1, "Updated Column", 2, 10, new ArrayList<>());
        Mockito.when(columnService.patchColumn(Mockito.any(ColumnDTO.class), Mockito.eq(1))).thenReturn(updateDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.patch("/columns/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        ColumnDTO returnedColumn = objectMapper.readValue(content, ColumnDTO.class);

        Assertions.assertEquals(updateDTO.id(), returnedColumn.id());
        Assertions.assertEquals(updateDTO.name(), returnedColumn.name());
        Assertions.assertEquals(updateDTO.position(), returnedColumn.position());
        Assertions.assertEquals(updateDTO.wipLimit(), returnedColumn.wipLimit());

        Mockito.verify(columnService).patchColumn(Mockito.any(ColumnDTO.class), Mockito.eq(1));
    }

    @Test
    void deleteColumnShouldReturnNoContent() throws Exception {
        // given
        Mockito.doNothing().when(columnService).deleteColumn(1);

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.delete("/columns/1"))
                .andExpect(MockMvcResultMatchers.status().isNoContent());

        Mockito.verify(columnService).deleteColumn(1);
    }

    @Test
    void updateColumnPositionShouldReturnUpdatedColumn() throws Exception {
        // given
        ColumnDTO updatedDTO = new ColumnDTO(1, "Test Column", 3, 5, new ArrayList<>());
        Mockito.when(columnService.updateColumnPosition(1, 3)).thenReturn(updatedDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.patch("/columns/1/position/3")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        ColumnDTO returnedColumn = objectMapper.readValue(content, ColumnDTO.class);

        Assertions.assertEquals(updatedDTO.id(), returnedColumn.id());
        Assertions.assertEquals(updatedDTO.name(), returnedColumn.name());
        Assertions.assertEquals(updatedDTO.position(), returnedColumn.position());
        Assertions.assertEquals(updatedDTO.wipLimit(), returnedColumn.wipLimit());

        Mockito.verify(columnService).updateColumnPosition(1, 3);
    }
}
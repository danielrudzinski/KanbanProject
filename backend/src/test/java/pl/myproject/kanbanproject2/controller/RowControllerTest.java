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
import pl.myproject.kanbanproject2.dto.RowDTO;
import pl.myproject.kanbanproject2.model.Row;
import pl.myproject.kanbanproject2.service.RowService;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@ExtendWith(MockitoExtension.class)
public class RowControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RowService rowService;

    @InjectMocks
    private RowController rowController;

    private ObjectMapper objectMapper;
    private Row testRow;
    private RowDTO testRowDTO;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(rowController).build();
        objectMapper = new ObjectMapper();

        testRow = new Row();
        testRow.setId(1);
        testRow.setName("Test Row");
        testRow.setPosition(1);
        testRow.setWipLimit(5);

        testRowDTO = new RowDTO(1, "Test Row", 1, 5, new ArrayList<>());
    }

    @AfterEach
    void tearDown() {
        testRow = null;
        testRowDTO = null;
    }

    @Test
    void getAllRowsShouldReturnListOfRows() throws Exception {
        // given
        List<RowDTO> rows = Arrays.asList(testRowDTO);
        Mockito.when(rowService.getAllRows()).thenReturn(rows);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/rows")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        List<RowDTO> returnedRows = objectMapper.readValue(content,
                objectMapper.getTypeFactory().constructCollectionType(List.class, RowDTO.class));

        Assertions.assertEquals(1, returnedRows.size());
        Assertions.assertEquals(testRowDTO.id(), returnedRows.get(0).id());
        Assertions.assertEquals(testRowDTO.name(), returnedRows.get(0).name());
        Assertions.assertEquals(testRowDTO.position(), returnedRows.get(0).position());
        Assertions.assertEquals(testRowDTO.wipLimit(), returnedRows.get(0).wipLimit());

        Mockito.verify(rowService).getAllRows();
    }

    @Test
    void getRowByIdShouldReturnRow() throws Exception {
        // given
        Mockito.when(rowService.getRowById(1)).thenReturn(testRowDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/rows/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        RowDTO returnedRow = objectMapper.readValue(content, RowDTO.class);

        Assertions.assertEquals(testRowDTO.id(), returnedRow.id());
        Assertions.assertEquals(testRowDTO.name(), returnedRow.name());
        Assertions.assertEquals(testRowDTO.position(), returnedRow.position());
        Assertions.assertEquals(testRowDTO.wipLimit(), returnedRow.wipLimit());

        Mockito.verify(rowService).getRowById(1);
    }

    @Test
    void createRowShouldReturnCreatedRow() throws Exception {
        // given
        Mockito.when(rowService.createRow(Mockito.any(Row.class))).thenReturn(testRow);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/rows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testRow)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        Row returnedRow = objectMapper.readValue(content, Row.class);

        Assertions.assertEquals(testRow.getId(), returnedRow.getId());
        Assertions.assertEquals(testRow.getName(), returnedRow.getName());
        Assertions.assertEquals(testRow.getPosition(), returnedRow.getPosition());
        Assertions.assertEquals(testRow.getWipLimit(), returnedRow.getWipLimit());

        Mockito.verify(rowService).createRow(Mockito.any(Row.class));
    }

    @Test
    void updateRowShouldReturnUpdatedRow() throws Exception {
        // given
        RowDTO updateDTO = new RowDTO(1, "Updated Row", 2, 10, new ArrayList<>());
        Mockito.when(rowService.patchRow(Mockito.any(RowDTO.class), Mockito.eq(1))).thenReturn(updateDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.patch("/rows/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        RowDTO returnedRow = objectMapper.readValue(content, RowDTO.class);

        Assertions.assertEquals(updateDTO.id(), returnedRow.id());
        Assertions.assertEquals(updateDTO.name(), returnedRow.name());
        Assertions.assertEquals(updateDTO.position(), returnedRow.position());
        Assertions.assertEquals(updateDTO.wipLimit(), returnedRow.wipLimit());

        Mockito.verify(rowService).patchRow(Mockito.any(RowDTO.class), Mockito.eq(1));
    }

    @Test
    void deleteRowShouldReturnNoContent() throws Exception {
        // given
        Mockito.doNothing().when(rowService).deleteRow(1);

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.delete("/rows/1"))
                .andExpect(MockMvcResultMatchers.status().isNoContent());

        Mockito.verify(rowService).deleteRow(1);
    }



    @Test
    void updateRowPositionShouldReturnUpdatedRow() throws Exception {
        // given
        RowDTO updatedDTO = new RowDTO(1, "Test Row", 3, 5, new ArrayList<>());
        Mockito.when(rowService.updateRowPosition(1, 3)).thenReturn(updatedDTO);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.patch("/rows/1/position/3")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();

        // then
        String content = result.getResponse().getContentAsString();
        RowDTO returnedRow = objectMapper.readValue(content, RowDTO.class);

        Assertions.assertEquals(updatedDTO.id(), returnedRow.id());
        Assertions.assertEquals(updatedDTO.name(), returnedRow.name());
        Assertions.assertEquals(updatedDTO.position(), returnedRow.position());
        Assertions.assertEquals(updatedDTO.wipLimit(), returnedRow.wipLimit());

        Mockito.verify(rowService).updateRowPosition(1, 3);
    }
}
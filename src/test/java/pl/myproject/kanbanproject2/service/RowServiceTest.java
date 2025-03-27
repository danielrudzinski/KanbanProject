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
import pl.myproject.kanbanproject2.dto.RowDTO;
import pl.myproject.kanbanproject2.mapper.RowMapper;
import pl.myproject.kanbanproject2.model.Row;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.repository.RowRepository;

import java.util.*;

@ExtendWith(MockitoExtension.class)
public class RowServiceTest {

    @Mock
    private RowRepository rowRepository;

    @Mock
    private RowMapper rowMapper;

    @InjectMocks
    private RowService rowService;

    @Mock
    private Task taskTest;

    private Row testRow;
    private RowDTO testRowDTO;

    @BeforeEach
    void setUp() {
        testRow = new Row();
        testRow.setName("name");
        testRow.setId(1);
        testRow.setPosition(1);
        testRow.setWipLimit(1);
        testRow.setTasks(new ArrayList<>());
        testRowDTO = new RowDTO(1, "name", 1, 1, new ArrayList<>());
    }

    @AfterEach
    void tearDown() {
        testRow = null;
        testRowDTO = null;
    }

    @Test
    void getAllRowsShouldGiveAllRows() {
        //given
        List<Row> rows = Arrays.asList(testRow);
        Mockito.when(rowRepository.findAll()).thenReturn(rows);
        Mockito.when(rowMapper.apply(testRow)).thenReturn(testRowDTO);
        //when
        List<RowDTO> result = rowService.getAllRows();
        //then
        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals(testRowDTO, result.get(0));
        Mockito.verify(rowRepository).findAll();
        Mockito.verify(rowMapper).apply(testRow);
    }

    @Test
    void getRowByIdShouldGiveRow() {
        // given
        Mockito.when(rowRepository.findById(testRow.getId())).thenReturn(Optional.of(testRow));
        Mockito.when(rowMapper.apply(testRow)).thenReturn(testRowDTO);
        // when
        RowDTO result = rowService.getRowById(testRow.getId());
        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testRowDTO.id(), result.id());
        Assertions.assertEquals(testRowDTO.position(), result.position());
        Assertions.assertEquals(testRowDTO.wipLimit(), result.wipLimit());
        Assertions.assertEquals(testRowDTO.taskDTO(), result.taskDTO());
        Assertions.assertEquals(testRowDTO.name(), result.name());
        Mockito.verify(rowRepository).findById(testRow.getId());
        Mockito.verify(rowMapper).apply(testRow);
    }

    @Test
    void deleteRowShouldDeleteSpecificRow() {
        // given
        Integer rowId = testRow.getId();
        Mockito.when(rowRepository.existsById(rowId)).thenReturn(true);

        // when
        rowService.deleteRow(rowId);

        // then
        Mockito.verify(rowRepository).existsById(rowId);
        Mockito.verify(rowRepository).deleteById(rowId);
        Mockito.verifyNoMoreInteractions(rowRepository);
    }


    @Test
    void deleteNotExistingRowShouldThrowException() {
        //given
        int rowId = 10;
        Mockito.when(rowRepository.existsById(rowId)).thenReturn(false);
        // when & then
        Assertions.assertThrows(EntityNotFoundException.class,
                () -> rowService.deleteRow(rowId));
        Mockito.verify(rowRepository).existsById(rowId);
        Mockito.verify(rowRepository, Mockito.never()).deleteById(rowId);
    }

    @Test
    void addRowShouldAddRow() {
        // given
        Row newRow = new Row();
        newRow.setName("name");
        newRow.setId(1);
        newRow.setPosition(null);
        newRow.setWipLimit(1);
        Row savedRow = new Row();
        savedRow.setId(1);
        savedRow.setName("name");
        savedRow.setPosition(2);
        savedRow.setWipLimit(1);
        Mockito.when(rowRepository.count()).thenReturn(1L);
        Mockito.when(rowRepository.save(Mockito.any(Row.class))).thenReturn(savedRow);
        // when
        Row result = rowService.createRow(newRow);
        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(savedRow.getId(), result.getId());
        Assertions.assertEquals(savedRow.getName(), result.getName());
        Assertions.assertEquals(savedRow.getWipLimit(), result.getWipLimit());
        Assertions.assertEquals(savedRow.getPosition(), result.getPosition());
        Mockito.verify(rowRepository).count();
        Mockito.verify(rowRepository).save(Mockito.any(Row.class));
    }

    @Test
    void patchRowShouldPatchRow() {
        // given
        RowDTO patchRowDTO = new RowDTO(1, "New name", 1, 1, new ArrayList<>());
        Mockito.when(rowRepository.findById(testRow.getId())).thenReturn(Optional.of(testRow));
        Mockito.when(rowRepository.save(Mockito.any(Row.class))).thenAnswer(invocation -> {
            Row savedRow = invocation.getArgument(0);
            return savedRow;
        });
        Mockito.when(rowMapper.apply(Mockito.any(Row.class))).thenAnswer(invocation -> {
            Row row = invocation.getArgument(0);
            return new RowDTO(
                    row.getId(),
                    row.getName(),
                    row.getPosition(),
                    row.getWipLimit(),
                    new ArrayList<>()
            );
        });
        // when
        RowDTO result = rowService.patchRow(patchRowDTO, testRow.getId());
        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(1, result.id());
        Assertions.assertEquals("New name", result.name());
        Assertions.assertEquals(1, result.position());
        Assertions.assertEquals(1, result.wipLimit());
        Mockito.verify(rowRepository).save(Mockito.any(Row.class));
    }

    @Test
    void updateRowPositionShouldUpdatePosition() {
        // given
        int newPosition = 3;
        Mockito.when(rowRepository.findById(testRow.getId())).thenReturn(Optional.of(testRow));
        Mockito.when(rowRepository.save(Mockito.any(Row.class))).thenAnswer(invocation -> {
            Row savedRow = invocation.getArgument(0);
            savedRow.setPosition(newPosition);
            return savedRow;
        });
        Mockito.when(rowMapper.apply(Mockito.any(Row.class))).thenAnswer(invocation -> {
            Row row = invocation.getArgument(0);
            return new RowDTO(row.getId(), row.getName(), row.getPosition(), row.getWipLimit(), new ArrayList<>());
        });
        // when
        RowDTO result = rowService.updateRowPosition(testRow.getId(), newPosition);
        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testRow.getId(), result.id());
        Assertions.assertEquals(newPosition, result.position());
        Assertions.assertEquals(testRow.getWipLimit(), result.wipLimit());
        Assertions.assertEquals(testRow.getName(), result.name());
        Mockito.verify(rowRepository).findById(testRow.getId());
        Mockito.verify(rowRepository).save(Mockito.any(Row.class));
        Mockito.verify(rowMapper).apply(Mockito.any(Row.class));
    }

    @Test
    void updateRowPositionShouldThrowExceptionWhenRowNotFound() {
        // given
        int rowId = 99;
        int newPosition = 5;
        Mockito.when(rowRepository.findById(rowId)).thenReturn(Optional.empty());
        // when & then
        Assertions.assertThrows(EntityNotFoundException.class, () -> rowService.updateRowPosition(rowId, newPosition));
        Mockito.verify(rowRepository).findById(rowId);
        Mockito.verify(rowRepository, Mockito.never()).save(Mockito.any(Row.class));
        Mockito.verify(rowMapper, Mockito.never()).apply(Mockito.any(Row.class));
    }
}
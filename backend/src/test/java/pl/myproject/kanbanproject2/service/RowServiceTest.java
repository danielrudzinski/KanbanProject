package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.myproject.kanbanproject2.dto.RowDTO;
import pl.myproject.kanbanproject2.mapper.RowMapper;
import pl.myproject.kanbanproject2.model.Row;
import pl.myproject.kanbanproject2.repository.RowRepository;
import pl.myproject.kanbanproject2.repository.TaskRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RowServiceTest {

    @Mock
    private RowRepository rowRepository;

    @Mock
    private RowMapper rowMapper;

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private RowService rowService;

    private Row row;
    private RowDTO rowDTO;

    @BeforeEach
    void setUp() {
        row = new Row();
        row.setId(1);
        row.setName("High Priority");
        row.setPosition(1);
        row.setWipLimit(3);

        rowDTO = new RowDTO(1, "High Priority", 1, 3, null);
    }

    @Test
    void getAllRows_ShouldReturnListOfRowDTOs() {
        // Given
        Row row2 = new Row();
        row2.setId(2);
        row2.setName("Low Priority");
        row2.setPosition(2);
        row2.setWipLimit(5);

        RowDTO rowDTO2 = new RowDTO(2, "Low Priority", 2, 5, null);

        List<Row> rows = Arrays.asList(row, row2);
        List<RowDTO> expectedDTOs = Arrays.asList(rowDTO, rowDTO2);

        when(rowRepository.findAll()).thenReturn(rows);
        when(rowMapper.apply(row)).thenReturn(rowDTO);
        when(rowMapper.apply(row2)).thenReturn(rowDTO2);

        // When
        List<RowDTO> result = rowService.getAllRows();

        // Then
        assertEquals(2, result.size());
        assertEquals(expectedDTOs, result);
        verify(rowRepository).findAll();
        verify(rowMapper, times(2)).apply(any(Row.class));
    }

    @Test
    void getAllRows_ShouldReturnEmptyList_WhenNoRowsExist() {
        // Given
        when(rowRepository.findAll()).thenReturn(Arrays.asList());

        // When
        List<RowDTO> result = rowService.getAllRows();

        // Then
        assertTrue(result.isEmpty());
        verify(rowRepository).findAll();
        verify(rowMapper, never()).apply(any(Row.class));
    }

    @Test
    void createRow_ShouldSetPositionAndSaveRow_WhenPositionIsNull() {
        // Given
        Row newRow = new Row();
        newRow.setName("New Row");
        newRow.setPosition(null);

        when(rowRepository.count()).thenReturn(2L);
        when(rowRepository.save(any(Row.class))).thenReturn(newRow);

        // When
        Row result = rowService.createRow(newRow);

        // Then
        assertEquals(3, newRow.getPosition());
        verify(rowRepository).count();
        verify(rowRepository).save(newRow);
        assertEquals(newRow, result);
    }

    @Test
    void createRow_ShouldNotChangePosition_WhenPositionIsNotNull() {
        // Given
        Row newRow = new Row();
        newRow.setName("New Row");
        newRow.setPosition(5);

        when(rowRepository.save(any(Row.class))).thenReturn(newRow);

        // When
        Row result = rowService.createRow(newRow);

        // Then
        assertEquals(5, newRow.getPosition());
        verify(rowRepository, never()).count();
        verify(rowRepository).save(newRow);
        assertEquals(newRow, result);
    }

    @Test
    void patchRow_ShouldUpdateAllFields_WhenAllFieldsProvided() {
        // Given
        Integer id = 1;
        RowDTO updateDTO = new RowDTO(1, "Updated Name", 3, 10, null);
        Row updatedRow = new Row();
        updatedRow.setId(1);
        updatedRow.setName("Updated Name");
        updatedRow.setPosition(3);
        updatedRow.setWipLimit(10);

        when(rowRepository.findById(id)).thenReturn(Optional.of(row));
        when(rowRepository.save(any(Row.class))).thenReturn(updatedRow);
        when(rowMapper.apply(updatedRow)).thenReturn(updateDTO);

        // When
        RowDTO result = rowService.patchRow(updateDTO, id);

        // Then
        assertEquals("Updated Name", row.getName());
        assertEquals(3, row.getPosition());
        assertEquals(10, row.getWipLimit());
        assertEquals(updateDTO, result);
        verify(rowRepository).findById(id);
        verify(rowRepository).save(row);
        verify(rowMapper).apply(updatedRow);
    }

    @Test
    void patchRow_ShouldUpdateOnlyName_WhenOnlyNameProvided() {
        // Given
        Integer id = 1;
        RowDTO updateDTO = new RowDTO(1, "Updated Name", null, null, null);

        when(rowRepository.findById(id)).thenReturn(Optional.of(row));
        when(rowRepository.save(any(Row.class))).thenReturn(row);
        when(rowMapper.apply(row)).thenReturn(rowDTO);

        // When
        RowDTO result = rowService.patchRow(updateDTO, id);

        // Then
        assertEquals("Updated Name", row.getName());
        assertEquals(1, row.getPosition()); // pozostaje bez zmian
        assertEquals(3, row.getWipLimit()); // pozostaje bez zmian
        verify(rowRepository).findById(id);
        verify(rowRepository).save(row);
    }

    @Test
    void patchRow_ShouldThrowEntityNotFoundException_WhenRowNotFound() {
        // Given
        Integer id = 999;
        RowDTO updateDTO = new RowDTO(1, "Updated Name", 3, 10, null);

        when(rowRepository.findById(id)).thenReturn(Optional.empty());

        // When & Then
        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> rowService.patchRow(updateDTO, id)
        );

        assertEquals("Nie ma takiego wiersza", exception.getMessage());
        verify(rowRepository).findById(id);
        verify(rowRepository, never()).save(any(Row.class));
        verify(rowMapper, never()).apply(any(Row.class));
    }

    @Test
    void deleteRow_ShouldDeleteRow_WhenRowExists() {
        // Given
        Integer id = 1;
        when(rowRepository.existsById(id)).thenReturn(true);

        // When
        rowService.deleteRow(id);

        // Then
        verify(rowRepository).existsById(id);
        verify(rowRepository).deleteById(id);
    }

    @Test
    void deleteRow_ShouldThrowEntityNotFoundException_WhenRowNotExists() {
        // Given
        Integer id = 999;
        when(rowRepository.existsById(id)).thenReturn(false);

        // When & Then
        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> rowService.deleteRow(id)
        );

        assertEquals("Nie ma kolumny o takim id", exception.getMessage());
        verify(rowRepository).existsById(id);
        verify(rowRepository, never()).deleteById(anyInt());
    }

    @Test
    void getRowById_ShouldReturnRowDTO_WhenRowExists() {
        // Given
        Integer id = 1;
        when(rowRepository.findById(id)).thenReturn(Optional.of(row));
        when(rowMapper.apply(row)).thenReturn(rowDTO);

        // When
        RowDTO result = rowService.getRowById(id);

        // Then
        assertEquals(rowDTO, result);
        verify(rowRepository).findById(id);
        verify(rowMapper).apply(row);
    }

    @Test
    void getRowById_ShouldThrowEntityNotFoundException_WhenRowNotFound() {
        // Given
        Integer id = 999;
        when(rowRepository.findById(id)).thenReturn(Optional.empty());

        // When & Then
        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> rowService.getRowById(id)
        );

        assertEquals("Nie ma wiersza", exception.getMessage());
        verify(rowRepository).findById(id);
        verify(rowMapper, never()).apply(any(Row.class));
    }

    @Test
    void updateRowPosition_ShouldUpdatePositionAndReturnDTO_WhenRowExists() {
        // Given
        Integer id = 1;
        Integer newPosition = 5;
        Row updatedRow = new Row();
        updatedRow.setId(1);
        updatedRow.setName("High Priority");
        updatedRow.setPosition(5);
        updatedRow.setWipLimit(3);

        RowDTO updatedDTO = new RowDTO(1, "High Priority", 5, 3, null);

        when(rowRepository.findById(id)).thenReturn(Optional.of(row));
        when(rowRepository.save(row)).thenReturn(updatedRow);
        when(rowMapper.apply(updatedRow)).thenReturn(updatedDTO);

        // When
        RowDTO result = rowService.updateRowPosition(id, newPosition);

        // Then
        assertEquals(5, row.getPosition());
        assertEquals(updatedDTO, result);
        verify(rowRepository).findById(id);
        verify(rowRepository).save(row);
        verify(rowMapper).apply(updatedRow);
    }

    @Test
    void updateRowPosition_ShouldThrowEntityNotFoundException_WhenRowNotFound() {
        // Given
        Integer id = 999;
        Integer newPosition = 5;
        when(rowRepository.findById(id)).thenReturn(Optional.empty());

        // When & Then
        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> rowService.updateRowPosition(id, newPosition)
        );

        assertEquals("Nie ma wiersza o takim id", exception.getMessage());
        verify(rowRepository).findById(id);
        verify(rowRepository, never()).save(any(Row.class));
        verify(rowMapper, never()).apply(any(Row.class));
    }
}
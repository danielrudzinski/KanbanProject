package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.myproject.kanbanproject2.dto.ColumnDTO;
import pl.myproject.kanbanproject2.mapper.ColumnMapper;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.repository.ColumnRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ColumnServiceTest {

    @Mock
    private ColumnRepository columnRepository;

    @Mock
    private ColumnMapper columnMapper;

    @InjectMocks
    private ColumnService columnService;

    private Column column;
    private ColumnDTO columnDTO;

    @BeforeEach
    void setUp() {
        column = new Column();
        column.setId(1);
        column.setName("To Do");
        column.setPosition(1);
        column.setWipLimit(5);

        columnDTO = new ColumnDTO(1, "To Do", 1, 5, null);
    }

    @Test
    void getAllColumns_ShouldReturnListOfColumnDTOs() {
        // Given
        Column column2 = new Column();
        column2.setId(2);
        column2.setName("In Progress");
        column2.setPosition(2);
        column2.setWipLimit(3);

        ColumnDTO columnDTO2 = new ColumnDTO(2, "In Progress", 2, 3, null);

        List<Column> columns = Arrays.asList(column, column2);
        List<ColumnDTO> expectedDTOs = Arrays.asList(columnDTO, columnDTO2);

        when(columnRepository.findAll()).thenReturn(columns);
        when(columnMapper.apply(column)).thenReturn(columnDTO);
        when(columnMapper.apply(column2)).thenReturn(columnDTO2);

        // When
        List<ColumnDTO> result = columnService.getAllColumns();

        // Then
        assertEquals(2, result.size());
        assertEquals(expectedDTOs, result);
        verify(columnRepository).findAll();
        verify(columnMapper, times(2)).apply(any(Column.class));
    }

    @Test
    void getAllColumns_ShouldReturnEmptyList_WhenNoColumnsExist() {
        // Given
        when(columnRepository.findAll()).thenReturn(Arrays.asList());

        // When
        List<ColumnDTO> result = columnService.getAllColumns();

        // Then
        assertTrue(result.isEmpty());
        verify(columnRepository).findAll();
        verify(columnMapper, never()).apply(any(Column.class));
    }

    @Test
    void addNewColumn_ShouldSetPositionAndSaveColumn_WhenPositionIsNull() {
        // Given
        Column newColumn = new Column();
        newColumn.setName("New Column");
        newColumn.setPosition(null);

        when(columnRepository.count()).thenReturn(2L);
        when(columnRepository.save(any(Column.class))).thenReturn(newColumn);

        // When
        Column result = columnService.addNewColumn(newColumn);

        // Then
        assertEquals(3, newColumn.getPosition());
        verify(columnRepository).count();
        verify(columnRepository).save(newColumn);
        assertEquals(newColumn, result);
    }

    @Test
    void addNewColumn_ShouldNotChangePosition_WhenPositionIsNotNull() {
        // Given
        Column newColumn = new Column();
        newColumn.setName("New Column");
        newColumn.setPosition(5);

        when(columnRepository.save(any(Column.class))).thenReturn(newColumn);

        // When
        Column result = columnService.addNewColumn(newColumn);

        // Then
        assertEquals(5, newColumn.getPosition());
        verify(columnRepository, never()).count();
        verify(columnRepository).save(newColumn);
        assertEquals(newColumn, result);
    }

    @Test
    void patchColumn_ShouldUpdateAllFields_WhenAllFieldsProvided() {
        // Given
        Integer id = 1;
        ColumnDTO updateDTO = new ColumnDTO(1, "Updated Name", 3, 10, null);
        Column updatedColumn = new Column();
        updatedColumn.setId(1);
        updatedColumn.setName("Updated Name");
        updatedColumn.setPosition(3);
        updatedColumn.setWipLimit(10);

        when(columnRepository.findById(id)).thenReturn(Optional.of(column));
        when(columnRepository.save(any(Column.class))).thenReturn(updatedColumn);
        when(columnMapper.apply(updatedColumn)).thenReturn(updateDTO);

        // When
        ColumnDTO result = columnService.patchColumn(updateDTO, id);

        // Then
        assertEquals("Updated Name", column.getName());
        assertEquals(3, column.getPosition());
        assertEquals(10, column.getWipLimit());
        assertEquals(updateDTO, result);
        verify(columnRepository).findById(id);
        verify(columnRepository).save(column);
        verify(columnMapper).apply(updatedColumn);
    }

    @Test
    void patchColumn_ShouldUpdateOnlyName_WhenOnlyNameProvided() {
        // Given
        Integer id = 1;
        ColumnDTO updateDTO = new ColumnDTO(1, "Updated Name", null, null, null);

        when(columnRepository.findById(id)).thenReturn(Optional.of(column));
        when(columnRepository.save(any(Column.class))).thenReturn(column);
        when(columnMapper.apply(column)).thenReturn(columnDTO);

        // When
        ColumnDTO result = columnService.patchColumn(updateDTO, id);

        // Then
        assertEquals("Updated Name", column.getName());
        assertEquals(1, column.getPosition()); // pozostaje bez zmian
        assertEquals(5, column.getWipLimit()); // pozostaje bez zmian
        verify(columnRepository).findById(id);
        verify(columnRepository).save(column);
    }

    @Test
    void patchColumn_ShouldThrowEntityNotFoundException_WhenColumnNotFound() {
        // Given
        Integer id = 999;
        ColumnDTO updateDTO = new ColumnDTO(1, "Updated Name", 3, 10, null);

        when(columnRepository.findById(id)).thenReturn(Optional.empty());

        // When & Then
        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> columnService.patchColumn(updateDTO, id)
        );

        assertEquals("Nie ma takiej kolumny", exception.getMessage());
        verify(columnRepository).findById(id);
        verify(columnRepository, never()).save(any(Column.class));
        verify(columnMapper, never()).apply(any(Column.class));
    }

    @Test
    void deleteColumn_ShouldDeleteColumn_WhenColumnExists() {
        // Given
        Integer id = 1;
        when(columnRepository.existsById(id)).thenReturn(true);

        // When
        columnService.deleteColumn(id);

        // Then
        verify(columnRepository).existsById(id);
        verify(columnRepository).deleteById(id);
    }

    @Test
    void deleteColumn_ShouldThrowEntityNotFoundException_WhenColumnNotExists() {
        // Given
        Integer id = 999;
        when(columnRepository.existsById(id)).thenReturn(false);

        // When & Then
        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> columnService.deleteColumn(id)
        );

        assertEquals("Nie ma kolumny o takim id", exception.getMessage());
        verify(columnRepository).existsById(id);
        verify(columnRepository, never()).deleteById(anyInt());
    }

    @Test
    void getColumnById_ShouldReturnColumnDTO_WhenColumnExists() {
        // Given
        Integer id = 1;
        when(columnRepository.findById(id)).thenReturn(Optional.of(column));
        when(columnMapper.apply(column)).thenReturn(columnDTO);

        // When
        ColumnDTO result = columnService.getColumnById(id);

        // Then
        assertEquals(columnDTO, result);
        verify(columnRepository).findById(id);
        verify(columnMapper).apply(column);
    }

    @Test
    void getColumnById_ShouldThrowEntityNotFoundException_WhenColumnNotFound() {
        // Given
        Integer id = 999;
        when(columnRepository.findById(id)).thenReturn(Optional.empty());

        // When & Then
        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> columnService.getColumnById(id)
        );

        assertEquals("Nie ma kolumny o takim id", exception.getMessage());
        verify(columnRepository).findById(id);
        verify(columnMapper, never()).apply(any(Column.class));
    }

    @Test
    void updateColumnPosition_ShouldUpdatePositionAndReturnDTO_WhenColumnExists() {
        // Given
        Integer id = 1;
        Integer newPosition = 5;
        Column updatedColumn = new Column();
        updatedColumn.setId(1);
        updatedColumn.setName("To Do");
        updatedColumn.setPosition(5);
        updatedColumn.setWipLimit(5);

        ColumnDTO updatedDTO = new ColumnDTO(1, "To Do", 5, 5, null);

        when(columnRepository.findById(id)).thenReturn(Optional.of(column));
        when(columnRepository.save(column)).thenReturn(updatedColumn);
        when(columnMapper.apply(updatedColumn)).thenReturn(updatedDTO);

        // When
        ColumnDTO result = columnService.updateColumnPosition(id, newPosition);

        // Then
        assertEquals(5, column.getPosition());
        assertEquals(updatedDTO, result);
        verify(columnRepository).findById(id);
        verify(columnRepository).save(column);
        verify(columnMapper).apply(updatedColumn);
    }

    @Test
    void updateColumnPosition_ShouldThrowEntityNotFoundException_WhenColumnNotFound() {
        // Given
        Integer id = 999;
        Integer newPosition = 5;
        when(columnRepository.findById(id)).thenReturn(Optional.empty());

        // When & Then
        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> columnService.updateColumnPosition(id, newPosition)
        );

        assertEquals("Nie ma kolumny o takim id", exception.getMessage());
        verify(columnRepository).findById(id);
        verify(columnRepository, never()).save(any(Column.class));
        verify(columnMapper, never()).apply(any(Column.class));
    }
}
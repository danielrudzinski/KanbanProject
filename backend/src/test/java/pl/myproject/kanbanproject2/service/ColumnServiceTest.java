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
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import pl.myproject.kanbanproject2.dto.ColumnDTO;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.mapper.ColumnMapper;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.ColumnRepository;

import java.util.*;

@ExtendWith(MockitoExtension.class)
public class ColumnServiceTest {
    @Mock
    private ColumnRepository columnRepository;
    @Mock
    private ColumnMapper columnMapper;
    @InjectMocks
    private ColumnService columnService;
    @Mock
    private Task taskTest;
    private Column testColumn;
    private ColumnDTO testColumnDTO;



    @BeforeEach
     void setUp() {
        testColumn = new Column();
        testColumn.setName("name");
        testColumn.setId(1);
        testColumn.setPosition(1);
        testColumn.setWipLimit(1);
        new ArrayList<>();

        testColumnDTO = new ColumnDTO(1,"name",1,1,new ArrayList<>());

     }
     @AfterEach
     void tearDown() {
        testColumn = null;
        testColumnDTO = null;
     }

    @Test
    void getAllColumnsShouldGiveAllColumns() {
        //given

        List<Column>columns = Arrays.asList(testColumn);
        Mockito.when(columnRepository.findAll()).thenReturn(columns);
        Mockito.when(columnMapper.apply(testColumn)).thenReturn(testColumnDTO);

        //when
        List<ColumnDTO> result = columnService.getAllColumns();

        //then
        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals(testColumnDTO, result.get(0));
        Mockito.verify(columnRepository).findAll();
        Mockito.verify(columnMapper).apply(testColumn);

    }
    @Test
    void getColumnByIdShouldGiveColumn() {
        // given
        Mockito.when(columnRepository.findById(testColumn.getId())).thenReturn(Optional.of(testColumn));
        Mockito.when(columnMapper.apply(testColumn)).thenReturn(testColumnDTO);

        // when
        ColumnDTO result = columnService.getColumnById(testColumn.getId());

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testColumnDTO.id(), result.id());
        Assertions.assertEquals(testColumnDTO.position(), result.position());
        Assertions.assertEquals(testColumnDTO.wipLimit(), result.wipLimit());
        Assertions.assertEquals(testColumnDTO.taskDTO(), result.taskDTO());
        Assertions.assertEquals(testColumnDTO.name(), result.name());
        Mockito.verify(columnRepository).findById(testColumn.getId());
        Mockito.verify(columnMapper).apply(testColumn);
    }
    @Test
    void deleteColumnShouldDeleteColumn() {
        // given
        Integer rowId = testColumn.getId();
        Mockito.when(columnRepository.existsById(rowId)).thenReturn(true);

        // when
        columnService.deleteColumn(rowId);

        // then
        Mockito.verify(columnRepository).existsById(rowId);
        Mockito.verify(columnRepository).deleteById(rowId);
        Mockito.verifyNoMoreInteractions(columnRepository);
    }
    @Test
    void deleteNotExistingColumnShouldThrowException() {
        //given
        int columnId = 10;
        Mockito.when(columnRepository.existsById(columnId)).thenReturn(false);
        // when & then
        Assertions.assertThrows(EntityNotFoundException.class,
                () -> columnService.deleteColumn(columnId));
        Mockito.verify(columnRepository).existsById(columnId);
        Mockito.verify(columnRepository, Mockito.never()).deleteById(columnId);
    }
    @Test
    void addColumnShouldAddColumn() {
        // given
        Column newColumn = new Column();
        newColumn.setName("name");
        newColumn.setId(1);
        newColumn.setPosition(null);
        newColumn.setWipLimit(1);

        Column savedColumn = new Column();
        savedColumn.setId(1);
        savedColumn.setName("name");
        savedColumn.setPosition(2);
        savedColumn.setWipLimit(1);

        // Mockowanie liczby kolumn w repozytorium
        Mockito.when(columnRepository.count()).thenReturn(1L);
        Mockito.when(columnRepository.save(Mockito.any(Column.class))).thenReturn(savedColumn);

        // when
        Column result = columnService.addNewColumn(newColumn);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(savedColumn.getId(), result.getId());
        Assertions.assertEquals(savedColumn.getName(), result.getName());
        Assertions.assertEquals(savedColumn.getWipLimit(), result.getWipLimit());
        Assertions.assertEquals(savedColumn.getPosition(), result.getPosition());

        // Weryfikacja interakcji z repozytorium
        Mockito.verify(columnRepository).count();
        Mockito.verify(columnRepository).save(Mockito.any(Column.class));
    }

    @Test
    void patchColumnShouldPatchUser() {
        // given
        ColumnDTO patchColumnDTO = new ColumnDTO(1, "New name", 1, 1, new ArrayList<>());

        Mockito.when(columnRepository.findById(testColumn.getId())).thenReturn(Optional.of(testColumn));
        Mockito.when(columnRepository.save(Mockito.any(Column.class))).thenAnswer(invocation -> {
            Column savedColumn = invocation.getArgument(0);
            return savedColumn;
        });

        Mockito.when(columnMapper.apply(Mockito.any(Column.class))).thenAnswer(invocation -> {
            Column column = invocation.getArgument(0);
            return new ColumnDTO(
                    column.getId(),
                    column.getName(),
                    column.getPosition(),
                    column.getWipLimit(),
                    new ArrayList<>()
            );
        });

        // when
        ColumnDTO result = columnService.patchColumn(patchColumnDTO, testColumn.getId());

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(1, result.id());
        Assertions.assertEquals("New name", result.name());
        Assertions.assertEquals(1, result.position());
        Assertions.assertEquals(1, result.wipLimit());

        Mockito.verify(columnRepository).save(Mockito.any(Column.class));
    }
    @Test
    void updateColumnPositionShouldUpdatePosition() {
        // given
        int newPosition = 3;

        Mockito.when(columnRepository.findById(testColumn.getId())).thenReturn(Optional.of(testColumn));
        Mockito.when(columnRepository.save(Mockito.any(Column.class))).thenAnswer(invocation -> {
            Column savedColumn = invocation.getArgument(0);
            savedColumn.setPosition(newPosition);
            return savedColumn;
        });
        Mockito.when(columnMapper.apply(Mockito.any(Column.class))).thenAnswer(invocation -> {
            Column column = invocation.getArgument(0);
            return new ColumnDTO(column.getId(), column.getName(), column.getPosition(), column.getWipLimit(), new ArrayList<>());
        });

        // when
        ColumnDTO result = columnService.updateColumnPosition(testColumn.getId(), newPosition);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testColumn.getId(), result.id());
        Assertions.assertEquals(newPosition, result.position());
        Assertions.assertEquals(testColumn.getWipLimit(), result.wipLimit());
        Assertions.assertEquals(testColumn.getName(), result.name());

        Mockito.verify(columnRepository).findById(testColumn.getId());
        Mockito.verify(columnRepository).save(Mockito.any(Column.class));
        Mockito.verify(columnMapper).apply(Mockito.any(Column.class));
    }

    @Test
    void updateColumnPositionShouldThrowExceptionWhenColumnNotFound() {
        // given
        int columnId = 99;
        int newPosition = 5;

        Mockito.when(columnRepository.findById(columnId)).thenReturn(Optional.empty());

        // when & then
        Assertions.assertThrows(EntityNotFoundException.class, () -> columnService.updateColumnPosition(columnId, newPosition));

        Mockito.verify(columnRepository).findById(columnId);
        Mockito.verify(columnRepository, Mockito.never()).save(Mockito.any(Column.class));
        Mockito.verify(columnMapper, Mockito.never()).apply(Mockito.any(Column.class));
    }

}

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
    private ServletUriComponentsBuilder servletUriComponentsBuilder;
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
    void deleteColumnsShouldDeleteAllColumns() {
        //given
        Mockito.when(columnRepository.existsById(testColumn.getId())).thenReturn(true);
        //when
        columnService.deleteColumn(testColumn.getId());
        //then
        Mockito.verify(columnRepository).existsById(testColumn.getId());
        Mockito.verify(columnRepository).deleteById(testColumn.getId());



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
        //given
        Mockito.when(columnRepository.save(testColumn)).thenReturn(testColumn);
        //when
        Column result = columnService.addNewColumn(testColumn);
        //then
        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testColumn.getId(), result.getId());
        Assertions.assertEquals(testColumn.getName(), result.getName());
        Assertions.assertEquals(testColumn.getTasks(), result.getTasks());
        Assertions.assertEquals(testColumn.getWipLimit(), result.getWipLimit());
        Assertions.assertEquals(testColumn.getPosition(), result.getPosition());
        Mockito.verify(columnRepository).save(testColumn);
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


}

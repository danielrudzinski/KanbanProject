/* package pl.myproject.kanbanproject2.service;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponents;
import pl.myproject.kanbanproject2.dto.ColumnDTO;
import pl.myproject.kanbanproject2.dto.UserDTO;
import pl.myproject.kanbanproject2.mapper.ColumnMapper;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.model.User;
import pl.myproject.kanbanproject2.repository.ColumnRepository;

import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

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
        testColumn.setWipLimit(1);
        new ArrayList<>();

        testColumnDTO = new ColumnDTO(1,"name",5,new ArrayList<>());

     }

    @Test
    void getAllColumnsShouldGiveAllColumns() {
        //given
        List<Column> columns = Arrays.asList(testColumn);
        Mockito.when(columnRepository.findAll()).thenReturn(columns);
        Mockito.when(columnMapper.apply(testColumn)).thenReturn(testColumnDTO);
        //when
        ResponseEntity<List<ColumnDTO>> response = columnService.getAllColumns();
        //then
        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(1, response.getBody().size());
        Assertions.assertEquals(testColumnDTO, response.getBody().get(0));
        Mockito.verify(columnRepository).findAll();
        Mockito.verify(columnMapper).apply(testColumn);
    }
    @Test
    void deleteColumnsShouldDeleteAllColumns() {
        //given
        Mockito.when(columnRepository.existsById(testColumn.getId())).thenReturn(true);
        //when
        ResponseEntity<Void> response = columnService.deleteColumn(testColumn.getId());
        //then
        Assertions.assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        Mockito.verify(columnRepository).deleteById(testColumn.getId());
        Mockito.verify(columnRepository).existsById(testColumn.getId());
    }
    @Test
    void deleteNotExistingColumnShouldThrowException() {
        //given
        Mockito.when(columnRepository.existsById(2)).thenReturn(false);
        //when
        ResponseEntity<Void> response = columnService.deleteColumn(2);
        //then
        Assertions.assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        Mockito.verify(columnRepository).existsById(2);
    }
    @Test
    void addColumnShouldAddColumn() {
        // given
        Mockito.when(columnRepository.save(testColumn)).thenReturn(testColumn);

        // when
        ResponseEntity<Column> response = columnService.addNewColumn(testColumn);

        // then
        Assertions.assertEquals(HttpStatus.CREATED, response.getStatusCode());
        Assertions.assertEquals(testColumn, response.getBody());
        Mockito.verify(columnRepository).save(testColumn);
    }
    @Test
    void updateColumnShouldUpdateUser() {
        // given
        Mockito.when(columnRepository.findById(testColumn.getId())).thenReturn(Optional.of(testColumn));
        Mockito.when(columnRepository.save(testColumn)).thenReturn(testColumn);
        // when
        ResponseEntity<Column> response = columnService.patchColumn(testColumn, testColumn.getId());
        //then
        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertEquals(testColumn, response.getBody());
        Mockito.verify(columnRepository).findById(testColumn.getId());
        Mockito.verify(columnRepository).save(testColumn);
    }


}
*/
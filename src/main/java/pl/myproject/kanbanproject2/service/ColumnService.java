package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import pl.myproject.kanbanproject2.dto.ColumnDTO;
import pl.myproject.kanbanproject2.dto.RowDTO;
import pl.myproject.kanbanproject2.mapper.ColumnMapper;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.repository.ColumnRepository;

import java.util.List;
import java.util.stream.Collectors;
@Transactional
@Service
public class ColumnService {
    private final ColumnRepository columnRepository;
    private final ColumnMapper columnMapper; // Dodajemy ColumnMapper

    @Autowired
    public ColumnService(ColumnRepository columnRepository, ColumnMapper columnMapper) { // Dodajemy ColumnMapper do konstruktora
        this.columnRepository = columnRepository;
        this.columnMapper = columnMapper;
    }

    public ResponseEntity<List<ColumnDTO>> getAllColumns() { // Zmieniamy typ zwracany na List<ColumnDTO>
        List<ColumnDTO> columnDTOs = columnRepository.findAll().stream()
                .map(columnMapper::apply) // Używamy ColumnMapper do przekształcenia Column na ColumnDTO
                .collect(Collectors.toList());
        return ResponseEntity.ok(columnDTOs);
    }

    public ResponseEntity<Column> addNewColumn(@RequestBody Column column) {
        Column newColumn = columnRepository.save(column);
        return ResponseEntity.created(null).body(newColumn);
    }

    public ResponseEntity<Column> patchColumn(@RequestBody Column column, @PathVariable Integer id) {
        return columnRepository.findById(id)
                .map(existingColumn -> {
                    if (column.getName() != null) {
                        existingColumn.setName(column.getName());
                    }
                    if (column.getWipLimit() != null) {
                        existingColumn.setWipLimit(column.getWipLimit());
                    }
                    return columnRepository.save(existingColumn);
                })
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    public ResponseEntity<Void>deleteColumn(@PathVariable Integer id ){
        if(!columnRepository.existsById(id)){
            return ResponseEntity.notFound().build();
        }

        columnRepository.deleteById(id);
        return ResponseEntity.noContent().build();

    }
    public ColumnDTO getColumnById(Integer id) {
        return columnRepository.findById(id).
                map(columnMapper::apply).
                orElseThrow(() -> new EntityNotFoundException("Nie ma wiersza"));
    }
}

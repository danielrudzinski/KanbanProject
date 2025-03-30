package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pl.myproject.kanbanproject2.dto.ColumnDTO;
import pl.myproject.kanbanproject2.mapper.ColumnMapper;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.repository.ColumnRepository;

import java.util.List;
import java.util.stream.Collectors;
@Transactional
@Service
public class ColumnService {
    private final ColumnRepository columnRepository;
    private final ColumnMapper columnMapper;

    @Autowired
    public ColumnService(ColumnRepository columnRepository, ColumnMapper columnMapper) {
        this.columnRepository = columnRepository;
        this.columnMapper = columnMapper;
    }

    public List<ColumnDTO> getAllColumns() {
        List<ColumnDTO> columnDTOS = columnRepository.findAll().stream()
                .map(columnMapper::apply)
                .collect(Collectors.toList());
        return columnDTOS;
    }

    public Column addNewColumn(Column column) {
        // If position is not set, set it to the last position + 1
        if (column.getPosition() == null) {
            long count = columnRepository.count();
            column.setPosition((int) count + 1);
        }
        return columnRepository.save(column);
    }

    public ColumnDTO patchColumn(ColumnDTO columnDTO, Integer id) {
        Column existingColumn = columnRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Nie ma takiej kolumny"));

        if (columnDTO.name() != null) {
            existingColumn.setName(columnDTO.name());
        }
        if(columnDTO.wipLimit() != null) {
            existingColumn.setWipLimit(columnDTO.wipLimit());
        }
        if(columnDTO.position() != null) {
            existingColumn.setPosition(columnDTO.position());
        }
        Column updatedColumn = columnRepository.save(existingColumn);
        return columnMapper.apply(updatedColumn);
    }

    public void deleteColumn(Integer id){
        if(!columnRepository.existsById(id)){
            throw new EntityNotFoundException("Nie ma kolumny o takim id");
        }
        columnRepository.deleteById(id);
    }

    public ColumnDTO getColumnById(Integer id) {
        return columnRepository.findById(id).
                map(columnMapper::apply).
                orElseThrow(() -> new EntityNotFoundException("Nie ma kolumny o takim id"));
    }

    public ColumnDTO updateColumnPosition(Integer id, Integer position) {
        Column column = columnRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma kolumny o takim id"));
        column.setPosition(position);
        Column updatedColumn = columnRepository.save(column);
        return columnMapper.apply(updatedColumn);
    }
    
}
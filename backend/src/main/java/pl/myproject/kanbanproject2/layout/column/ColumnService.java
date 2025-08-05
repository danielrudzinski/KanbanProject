package pl.myproject.kanbanproject2.layout.column;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.myproject.kanbanproject2.exception.ExceptionIdentifier;
import pl.myproject.kanbanproject2.exception.GlobalException;

import java.util.List;

@RequiredArgsConstructor
@Transactional
@Service
public class ColumnService {

    private final ColumnRepository columnRepository;
    private final ColumnMapper columnMapper;

    public List<ColumnDto> getAllColumns() {
        return columnRepository.findAll().stream().map(columnMapper).toList();
    }

    public ColumnResponseDto addNewColumn(Column column) {
        if (column.getPosition() == null) {
            column.setPosition((int) columnRepository.count() + 1);
        }
        return columnMapper.toResponseDto(columnRepository.save(column));
    }

    public ColumnDto patchColumn(ColumnDto columnDto, Integer id) {
        var existingColumn = findColumn(id);

        if (columnDto.name() != null) {
            existingColumn.setName(columnDto.name());
        }
        if (columnDto.wipLimit() != null) {
            existingColumn.setWipLimit(columnDto.wipLimit());
        }
        if (columnDto.position() != null) {
            existingColumn.setPosition(columnDto.position());
        }
        return columnMapper.apply(columnRepository.save(existingColumn));
    }

    public void deleteColumn(Integer id) {
        if (!columnRepository.existsById(id)) {
            throw columnNotFound(id);
        }
        columnRepository.deleteById(id);
    }

    public ColumnDto getColumnById(Integer id) {
        return columnRepository.findById(id).map(columnMapper)
                .orElseThrow(() -> columnNotFound(id));
    }

    public ColumnDto updateColumnPosition(Integer id, Integer position) {
        var column = findColumn(id);
        column.setPosition(position);
        return columnMapper.apply(columnRepository.save(column));
    }

    private Column findColumn(Integer id) {
        return columnRepository.findById(id).orElseThrow(() -> columnNotFound(id));
    }

    private GlobalException columnNotFound(Integer id) {
        return new GlobalException(ExceptionIdentifier.COLUMN_NOT_FOUND,
                "Column not found with id: " + id);
    }
}

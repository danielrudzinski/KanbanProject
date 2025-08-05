package pl.myproject.kanbanproject2.layout.row;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.myproject.kanbanproject2.exception.ExceptionIdentifier;
import pl.myproject.kanbanproject2.exception.GlobalException;

import java.util.List;

@RequiredArgsConstructor
@Transactional
@Service
public class RowService {

    private final RowRepository rowRepository;
    private final RowMapper rowMapper;

    public List<RowDto> getAllRows() {
        return rowRepository.findAll().stream().map(rowMapper).toList();
    }

    public RowResponseDto createRow(Row row) {
        if (row.getPosition() == null) {
            row.setPosition((int) rowRepository.count() + 1);
        }
        return rowMapper.toResponseDto(rowRepository.save(row));
    }

    public RowDto patchRow(RowDto rowDto, Integer id) {
        var existingRow = findRow(id);

        if (rowDto.name() != null) {
            existingRow.setName(rowDto.name());
        }
        if (rowDto.wipLimit() != null) {
            existingRow.setWipLimit(rowDto.wipLimit());
        }
        if (rowDto.position() != null) {
            existingRow.setPosition(rowDto.position());
        }
        return rowMapper.apply(rowRepository.save(existingRow));
    }

    public void deleteRow(Integer id) {
        if (!rowRepository.existsById(id)) {
            throw rowNotFound(id);
        }
        rowRepository.deleteById(id);
    }

    public RowDto getRowById(Integer id) {
        return rowRepository.findById(id).map(rowMapper).orElseThrow(() -> rowNotFound(id));
    }

    public RowDto updateRowPosition(Integer id, Integer position) {
        var row = findRow(id);
        row.setPosition(position);
        return rowMapper.apply(rowRepository.save(row));
    }

    private Row findRow(Integer id) {
        return rowRepository.findById(id).orElseThrow(() -> rowNotFound(id));
    }

    private GlobalException rowNotFound(Integer id) {
        return new GlobalException(ExceptionIdentifier.ROW_NOT_FOUND,
                "Row not found with id: " + id);
    }
}

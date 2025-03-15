package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponents;
import pl.myproject.kanbanproject2.dto.RowDTO;
import pl.myproject.kanbanproject2.mapper.RowMapper;
import pl.myproject.kanbanproject2.model.Row;
import pl.myproject.kanbanproject2.repository.RowRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Transactional
@Service
public class RowService {
    private final RowRepository rowRepository;
    private final RowMapper rowMapper;

    @Autowired
    public RowService(RowRepository rowRepository, RowMapper rowMapper) {
        this.rowRepository = rowRepository;
        this.rowMapper = rowMapper;
    }

    public List<RowDTO> getAllRows() {
        List<RowDTO> rowDTOS = rowRepository.findAll().stream()
                .map(rowMapper::apply)
                .collect(Collectors.toList());
        return rowDTOS;
    }

    // In your RowService.java
    public Row createRow(Row row) {
        // Check for existing tasks and handle them
        if (row.getTasks() != null) {
            for (Task task : row.getTasks()) {
                if (task.getId() != null) {
                    // This is an existing task
                    Task existingTask = taskRepository.findById(task.getId()).orElse(null);
                    if (existingTask != null) {
                        task.setRow(row);
                    }
                } else {
                    // New task
                    task.setRow(row);
                }
            }
        }
        return rowRepository.save(row);
    }

    public RowDTO patchRow(RowDTO rowDTO, Integer id) {
        Row existingRow = rowRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Nie ma takiego wiersza"));

        if (rowDTO.name() != null) {
            existingRow.setName(rowDTO.name());
        }
        if(rowDTO.wipLimit() != null) {
            existingRow.setWipLimit(rowDTO.wipLimit());
        }
        Row updatedRow = rowRepository.save(existingRow);
        return rowMapper.apply(updatedRow);
    }

    public void deleteRow(Integer id) {
        if (!rowRepository.existsById(id)) {
            throw new EntityNotFoundException("Nie ma wiersza o takim ID");
        }
        rowRepository.deleteById(id);
    }

    public RowDTO getRowById(Integer id) {
        return rowRepository.findById(id).
                map(rowMapper::apply).
                orElseThrow(() -> new EntityNotFoundException("Nie ma wiersza"));
    }
}
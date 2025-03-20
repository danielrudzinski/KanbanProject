package pl.myproject.kanbanproject2.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pl.myproject.kanbanproject2.dto.RowDTO;
import pl.myproject.kanbanproject2.mapper.RowMapper;
import pl.myproject.kanbanproject2.model.Row;
import pl.myproject.kanbanproject2.model.Task;
import pl.myproject.kanbanproject2.repository.RowRepository;
import pl.myproject.kanbanproject2.repository.TaskRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Transactional
@Service
public class RowService {
    private final RowRepository rowRepository;
    private final RowMapper rowMapper;
    private final TaskRepository taskRepository;

    @Autowired
    public RowService(RowRepository rowRepository, RowMapper rowMapper, TaskRepository taskRepository) {
        this.rowRepository = rowRepository;
        this.rowMapper = rowMapper;
        this.taskRepository = taskRepository;
    }

    public List<RowDTO> getAllRows() {
        List<RowDTO> rowDTOS = rowRepository.findAll().stream()
                .map(rowMapper::apply)
                .collect(Collectors.toList());
        return rowDTOS;
    }

    public Row createRow(Row row) {

        if (row.getPosition() == null) {
            long count = rowRepository.count();
            row.setPosition((int) count + 1);
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
        if(rowDTO.position() != null) {
            existingRow.setPosition(rowDTO.position());
        }
        Row updatedRow = rowRepository.save(existingRow);
        return rowMapper.apply(updatedRow);
    }

    public void deleteRow(Integer id) {
        if (!rowRepository.existsById(id)) {
            throw new EntityNotFoundException("Nie ma wiersza o takim ID");
        }

        try {
            Row rowToDelete = rowRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Nie ma wiersza o takim ID"));

            if (rowToDelete.getTasks() != null) {
                List<Task> tasksToUpdate = new ArrayList<>(rowToDelete.getTasks());
                for (Task task : tasksToUpdate) {
                    task.setRow(null);
                    taskRepository.save(task);
                }
                rowToDelete.setTasks(new ArrayList<>());
                rowRepository.save(rowToDelete);
            }
            
            rowRepository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Błąd podczas usuwania wiersza: " + e.getMessage());
        }
    }


    public RowDTO getRowById(Integer id) {
        return rowRepository.findById(id).
                map(rowMapper::apply).
                orElseThrow(() -> new EntityNotFoundException("Nie ma wiersza"));
    }

    public RowDTO updateRowPosition(Integer id, Integer position) {
        Row row = rowRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Nie ma wiersza o takim id"));
        row.setPosition(position);
        Row updatedRow = rowRepository.save(row);
        return rowMapper.apply(updatedRow);
    }
}
package pl.myproject.kanbanproject2.controller;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.dto.ColumnDTO;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.service.ColumnService;
import java.util.List;

@RestController
@RequestMapping("/columns")
public class ColumnController {

    private final ColumnService columnService;

    public ColumnController(ColumnService columnService) {
        this.columnService = columnService;
    }

    @GetMapping
    public ResponseEntity<List<ColumnDTO>> getAllColumns() {
        return ResponseEntity.ok(columnService.getAllColumns());
    }

    @PostMapping
    public ResponseEntity<Column> addNewColumn(@RequestBody Column column) {
        return ResponseEntity.ok(columnService.addNewColumn(column));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ColumnDTO> patchColumn(@RequestBody ColumnDTO column, @PathVariable Integer id) {
        return ResponseEntity.ok(columnService.patchColumn(column, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteColumn(@PathVariable Integer id) {
        columnService.deleteColumn(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ColumnDTO> getColumnById(@PathVariable Integer id) {
        return ResponseEntity.ok(columnService.getColumnById(id));
    }

    @PatchMapping("/{id}/position/{position}")
    public ResponseEntity<ColumnDTO> updateColumnPosition(
            @PathVariable Integer id,
            @PathVariable Integer position) {
        return ResponseEntity.ok(columnService.updateColumnPosition(id, position));
    }
}
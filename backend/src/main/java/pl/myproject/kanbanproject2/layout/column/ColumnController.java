package pl.myproject.kanbanproject2.layout.column;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/columns")
public class ColumnController {

    private final ColumnService columnService;

    public ColumnController(ColumnService columnService) {
        this.columnService = columnService;
    }

    @GetMapping
    public ResponseEntity<List<ColumnDto>> getAllColumns() {
        return ResponseEntity.ok(columnService.getAllColumns());
    }

    @PostMapping
    public ResponseEntity<ColumnResponseDto> addNewColumn(@RequestBody Column column) {
        return ResponseEntity.status(HttpStatus.CREATED).body(columnService.addNewColumn(column));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ColumnDto> patchColumn(@RequestBody ColumnDto column, @PathVariable Integer id) {
        return ResponseEntity.ok(columnService.patchColumn(column, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteColumn(@PathVariable Integer id) {
        columnService.deleteColumn(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ColumnDto> getColumnById(@PathVariable Integer id) {
        return ResponseEntity.ok(columnService.getColumnById(id));
    }

    @PatchMapping("/{id}/position/{position}")
    public ResponseEntity<ColumnDto> updateColumnPosition(
            @PathVariable Integer id,
            @PathVariable Integer position) {
        return ResponseEntity.ok(columnService.updateColumnPosition(id, position));
    }
}
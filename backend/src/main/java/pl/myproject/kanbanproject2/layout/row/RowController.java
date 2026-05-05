package pl.myproject.kanbanproject2.layout.row;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/rows")
@RequiredArgsConstructor
public class RowController {

    private final RowService rowService;


    @GetMapping
    public ResponseEntity<List<RowDto>> getAllRows() {
        return ResponseEntity.ok(rowService.getAllRows());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RowDto> getRowById(@PathVariable Integer id) {
        return ResponseEntity.ok(rowService.getRowById(id));
    }

    @PostMapping
    public ResponseEntity<RowResponseDto> createRow(@RequestBody Row row) {
        return ResponseEntity.status(HttpStatus.CREATED).body(rowService.createRow(row));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RowDto> updateRow(@RequestBody RowDto row, @PathVariable Integer id) {
        return ResponseEntity.ok(rowService.patchRow(row, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRow(@PathVariable Integer id) {
        rowService.deleteRow(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/position/{position}")
    public ResponseEntity<RowDto> updateRowPosition(
            @PathVariable Integer id,
            @PathVariable Integer position) {
        return ResponseEntity.ok(rowService.updateRowPosition(id, position));
    }
}
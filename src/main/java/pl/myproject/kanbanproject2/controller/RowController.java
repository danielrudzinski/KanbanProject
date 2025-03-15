package pl.myproject.kanbanproject2.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.dto.RowDTO;
import pl.myproject.kanbanproject2.model.Row;
import pl.myproject.kanbanproject2.service.RowService;

import java.util.List;

@RestController
@RequestMapping("/rows")
public class RowController {

    private final RowService rowService;

    @Autowired
    public RowController(RowService rowService) {
        this.rowService = rowService;
    }

    @GetMapping
    public ResponseEntity<List<RowDTO>> getAllRows() {
        return ResponseEntity.ok(rowService.getAllRows());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RowDTO> getRowById(@PathVariable Integer id) {
        return  ResponseEntity.ok(rowService.getRowById(id));
    }

    @PostMapping
    public ResponseEntity<Row> createRow(@RequestBody Row row) {
        return ResponseEntity.ok(rowService.createRow(row));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RowDTO> updateRow(@RequestBody RowDTO row, @PathVariable Integer id) {
        return ResponseEntity.ok(rowService.patchRow(row, id));
    }

    @DeleteMapping("/{id}")
    public void deleteRow(@PathVariable Integer id) {
        rowService.deleteRow(id);
        ResponseEntity.noContent().build();

    }
}

package pl.myproject.kanbanproject2.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.dto.ColumnDTO;
import pl.myproject.kanbanproject2.model.Column;
import pl.myproject.kanbanproject2.service.ColumnService;
import java.net.URI;
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
        return columnService.getAllColumns();
    }

    @PostMapping
    public ResponseEntity<Column> addNewColumn(@RequestBody Column column) {
        return columnService.addNewColumn(column);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Column> patchColumn( @RequestBody Column column ,@PathVariable Integer id) {
        return columnService.patchColumn(column, id);
    }
    @DeleteMapping("{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id){

        return columnService.deleteColumn(id);
    }


}

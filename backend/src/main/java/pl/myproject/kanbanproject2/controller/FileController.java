package pl.myproject.kanbanproject2.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pl.myproject.kanbanproject2.model.File;
import pl.myproject.kanbanproject2.service.FileService;

@RestController
@RequestMapping("/files")
public class FileController {
    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        File savedFile = fileService.saveFile(file);
        return ResponseEntity.ok("Plik załadowany z sukcesem! ID: " + savedFile.getId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getFile(@PathVariable Long id) {
        File fileEntity = fileService.getFile(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileEntity.getType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileEntity.getName() + "\"")
                .body(fileEntity.getData());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFile(@PathVariable Long id) {
        fileService.deleteFile(id);
        return ResponseEntity.ok("Plik usunięty pomyślnie!");
    }
}
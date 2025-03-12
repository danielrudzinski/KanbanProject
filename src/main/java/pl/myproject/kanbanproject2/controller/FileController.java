package pl.myproject.kanbanproject2.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pl.myproject.kanbanproject2.model.FileEntity;
import pl.myproject.kanbanproject2.service.FileService;

import java.io.IOException;

@RestController
@RequestMapping("/files")
public class FileController {
    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            FileEntity savedFile = fileService.saveFile(file);
            return ResponseEntity.ok("File uploaded successfully! ID: " + savedFile.getId());
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Failed to upload file.");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getFile(@PathVariable Long id) {
        FileEntity fileEntity = fileService.getFile(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileEntity.getType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileEntity.getName() + "\"")
                .body(fileEntity.getData());
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFile(@PathVariable Long id) {
        try {
            fileService.deleteFile(id);
            return ResponseEntity.ok("File deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("File not found");
        }
    }

}

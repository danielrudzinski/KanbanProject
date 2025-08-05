package pl.myproject.kanbanproject2.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ContentDisposition;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import pl.myproject.kanbanproject2.file.File;
import pl.myproject.kanbanproject2.file.FileUploadResponse;
import pl.myproject.kanbanproject2.file.FileService;

import java.net.URI;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        File savedFile = fileService.saveFile(file);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/files/{id}")
                .buildAndExpand(savedFile.getId())
                .toUri();

        FileUploadResponse response = new FileUploadResponse(
                savedFile.getId(),
                savedFile.getName(),
                savedFile.getType(),
                savedFile.getData().length,
                location.toString()
        );

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getFile(@PathVariable Long id) {
        File fileEntity = fileService.getFile(id);
        MediaType mediaType = StringUtils.hasText(fileEntity.getType())
                ? MediaType.parseMediaType(fileEntity.getType())
                : MediaType.APPLICATION_OCTET_STREAM;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(fileEntity.getName()).build().toString())
                .body(fileEntity.getData());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        fileService.deleteFile(id);
        return ResponseEntity.noContent().build();
    }
}
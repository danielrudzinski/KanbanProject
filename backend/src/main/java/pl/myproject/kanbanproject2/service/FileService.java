package pl.myproject.kanbanproject2.service;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pl.myproject.kanbanproject2.model.File;
import pl.myproject.kanbanproject2.repository.FileRepository;

import java.io.IOException;

@Transactional
@Service
public class FileService {
    private final FileRepository fileRepository;

    @Autowired
    public FileService(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    public File saveFile(MultipartFile file) {
        try {
            File fileEntity = new File(
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getBytes()
            );
            return fileRepository.save(fileEntity);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nie udało się wysłać pliku.", e);
        }
    }

    public File getFile(Long id) {
        return fileRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
    }

    public void deleteFile(Long id) {
        if (!fileRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
        fileRepository.deleteById(id);
    }
}
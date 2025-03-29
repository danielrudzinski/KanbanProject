package pl.myproject.kanbanproject2.service;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
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

    public File saveFile(MultipartFile file) throws IOException {
        File fileEntity = new File(
                file.getOriginalFilename(),
                file.getContentType(),
                file.getBytes()
        );
        return fileRepository.save(fileEntity);
    }

    public File getFile(Long id) {
        return fileRepository.findById(id).orElseThrow(() -> new RuntimeException("File not found"));
    }
    public void deleteFile(Long id) {
        if (!fileRepository.existsById(id)) {
            throw new RuntimeException("File not found");
        }
        fileRepository.deleteById(id);
    }

}

package pl.myproject.kanbanproject2.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import pl.myproject.kanbanproject2.model.FileEntity;
import pl.myproject.kanbanproject2.repository.FileRepository;

import java.io.IOException;

@Service
public class FileService {
    private final FileRepository fileRepository;
    @Autowired
    public FileService(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    public FileEntity saveFile(MultipartFile file) throws IOException {
        FileEntity fileEntity = new FileEntity(
                file.getOriginalFilename(),
                file.getContentType(),
                file.getBytes()
        );
        return fileRepository.save(fileEntity);
    }

    public FileEntity getFile(Long id) {
        return fileRepository.findById(id).orElseThrow(() -> new RuntimeException("File not found"));
    }
    public void deleteFile(Long id) {
        if (!fileRepository.existsById(id)) {
            throw new RuntimeException("File not found");
        }
        fileRepository.deleteById(id);
    }

}

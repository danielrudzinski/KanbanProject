package pl.myproject.kanbanproject2.file;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import pl.myproject.kanbanproject2.exception.ExceptionIdentifier;
import pl.myproject.kanbanproject2.exception.GlobalException;

import java.io.IOException;

@RequiredArgsConstructor
@Transactional
@Service
public class FileService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final FileRepository fileRepository;

    public File saveFile(MultipartFile file) {
        validateFile(file);

        try {
            String sanitizedFileName = StringUtils.cleanPath(file.getOriginalFilename());

            File fileEntity = new File(
                    sanitizedFileName,
                    file.getContentType().trim(),
                    file.getBytes()
            );
            return fileRepository.save(fileEntity);
        } catch (IOException e) {
            throw new GlobalException(ExceptionIdentifier.FILE_UPLOAD_FAILED, e);
        }
    }

    public File getFile(Long id) {
        return fileRepository.findById(id)
                .orElseThrow(() -> new GlobalException(ExceptionIdentifier.FILE_NOT_FOUND,
                        "File not found with id: " + id));
    }

    public void deleteFile(Long id) {
        if (!fileRepository.existsById(id)) {
            throw new GlobalException(ExceptionIdentifier.FILE_NOT_FOUND,
                    "File not found with id: " + id);
        }
        fileRepository.deleteById(id);
    }

    private void validateFile(MultipartFile file) {
        if (file == null) {
            throw new IllegalArgumentException("A file is required");
        }
        if (file.isEmpty() || file.getSize() <= 0) {
            throw new IllegalArgumentException("The uploaded file must not be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("The uploaded file exceeds the maximum allowed size of 10 MB");
        }
        if (!StringUtils.hasText(file.getOriginalFilename())) {
            throw new IllegalArgumentException("The uploaded file must have a valid file name");
        }
        String sanitizedFileName = StringUtils.cleanPath(file.getOriginalFilename());
        if (!StringUtils.hasText(sanitizedFileName) || sanitizedFileName.contains("..")) {
            throw new IllegalArgumentException("The uploaded file name is invalid");
        }
        if (!StringUtils.hasText(file.getContentType())) {
            throw new IllegalArgumentException("The uploaded file must have a content type");
        }
    }
}

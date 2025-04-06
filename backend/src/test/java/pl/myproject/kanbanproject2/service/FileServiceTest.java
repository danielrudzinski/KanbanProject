package pl.myproject.kanbanproject2.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pl.myproject.kanbanproject2.model.File;
import pl.myproject.kanbanproject2.repository.FileRepository;

import java.io.IOException;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
public class FileServiceTest {
    @Mock
    private FileRepository fileRepository;

    @InjectMocks
    private FileService fileService;

    private File testFile;
    private MockMultipartFile mockMultipartFile;

    @BeforeEach
    void setUp() {
        // Przygotowanie testowego pliku
        byte[] content = "test content".getBytes();
        testFile = new File("test.txt", "text/plain", content);
        testFile.setId(1L);

        // Przygotowanie mock dla MultipartFile
        mockMultipartFile = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                content
        );
    }

    @AfterEach
    void tearDown() {
        testFile = null;
        mockMultipartFile = null;
    }

    @Test
    void saveFileShouldSaveFile() throws IOException {
        // given
        Mockito.when(fileRepository.save(Mockito.any(File.class))).thenReturn(testFile);

        // when
        File result = fileService.saveFile(mockMultipartFile);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testFile.getId(), result.getId());
        Assertions.assertEquals(testFile.getName(), result.getName());
        Assertions.assertEquals(testFile.getType(), result.getType());
        Assertions.assertArrayEquals(testFile.getData(), result.getData());

        Mockito.verify(fileRepository).save(Mockito.any(File.class));
    }

    @Test
    void getFileShouldReturnFile() {
        // given
        Long fileId = testFile.getId();
        Mockito.when(fileRepository.findById(fileId)).thenReturn(Optional.of(testFile));

        // when
        File result = fileService.getFile(fileId);

        // then
        Assertions.assertNotNull(result);
        Assertions.assertEquals(testFile.getId(), result.getId());
        Assertions.assertEquals(testFile.getName(), result.getName());
        Assertions.assertEquals(testFile.getType(), result.getType());
        Assertions.assertArrayEquals(testFile.getData(), result.getData());

        Mockito.verify(fileRepository).findById(fileId);
    }

    @Test
    void getFileShouldThrowExceptionWhenFileNotFound() {
        // given
        Long fileId = 99L;
        Mockito.when(fileRepository.findById(fileId)).thenReturn(Optional.empty());

        // when & then
        ResponseStatusException exception = Assertions.assertThrows(
                ResponseStatusException.class,
                () -> fileService.getFile(fileId)
        );
        Assertions.assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        Assertions.assertEquals("File not found", exception.getReason());

        Mockito.verify(fileRepository).findById(fileId);
    }

    @Test
    void deleteFileShouldDeleteFile() {
        // given
        Long fileId = testFile.getId();
        Mockito.when(fileRepository.existsById(fileId)).thenReturn(true);

        // when
        fileService.deleteFile(fileId);

        // then
        Mockito.verify(fileRepository).existsById(fileId);
        Mockito.verify(fileRepository).deleteById(fileId);
    }

    @Test
    void deleteFileShouldThrowExceptionWhenFileNotFound() {
        // given
        Long fileId = 99L;
        Mockito.when(fileRepository.existsById(fileId)).thenReturn(false);

        // when & then
        ResponseStatusException exception = Assertions.assertThrows(
                ResponseStatusException.class,
                () -> fileService.deleteFile(fileId)
        );
        Assertions.assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        Assertions.assertEquals("File not found", exception.getReason());

        Mockito.verify(fileRepository).existsById(fileId);
        Mockito.verify(fileRepository, Mockito.never()).deleteById(fileId);
    }
}
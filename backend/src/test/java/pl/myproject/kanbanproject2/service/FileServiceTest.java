package pl.myproject.kanbanproject2.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pl.myproject.kanbanproject2.model.File;
import pl.myproject.kanbanproject2.repository.FileRepository;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @InjectMocks
    private FileService fileService;

    @Mock
    private FileRepository fileRepository;

    @Mock
    private MultipartFile multipartFile;

    @Test
    void shouldSaveFileSuccessfully() throws IOException {
        // Given
        byte[] fileContent = "test content".getBytes();
        when(multipartFile.getOriginalFilename()).thenReturn("test.txt");
        when(multipartFile.getContentType()).thenReturn("text/plain");
        when(multipartFile.getBytes()).thenReturn(fileContent);

        File savedFile = new File("test.txt", "text/plain", fileContent);
        when(fileRepository.save(any(File.class))).thenReturn(savedFile);

        // When
        File result = fileService.saveFile(multipartFile);

        // Then
        assertNotNull(result);
        assertEquals("test.txt", result.getName());
        assertEquals("text/plain", result.getType());
        assertArrayEquals(fileContent, result.getData());
        verify(fileRepository).save(any(File.class));
    }

    @Test
    void shouldThrowExceptionWhenIOExceptionOccurs() throws IOException {
        // Given
        when(multipartFile.getOriginalFilename()).thenReturn("test.txt");
        when(multipartFile.getContentType()).thenReturn("text/plain");
        when(multipartFile.getBytes()).thenThrow(new IOException("IO Error"));

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> fileService.saveFile(multipartFile));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exception.getStatusCode());
        assertEquals("Nie udało się wysłać pliku.", exception.getReason());
        verify(fileRepository, never()).save(any(File.class));
    }

    @Test
    void shouldGetFileSuccessfully() {
        // Given
        Long fileId = 1L;
        File file = new File("test.txt", "text/plain", "content".getBytes());
        when(fileRepository.findById(fileId)).thenReturn(Optional.of(file));

        // When
        File result = fileService.getFile(fileId);

        // Then
        assertNotNull(result);
        assertEquals("test.txt", result.getName());
        assertEquals("text/plain", result.getType());
        verify(fileRepository).findById(fileId);
    }

    @Test
    void shouldThrowExceptionWhenFileNotFound() {
        // Given
        Long fileId = 1L;
        when(fileRepository.findById(fileId)).thenReturn(Optional.empty());

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> fileService.getFile(fileId));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("File not found", exception.getReason());
        verify(fileRepository).findById(fileId);
    }

    @Test
    void shouldDeleteFileSuccessfully() {
        // Given
        Long fileId = 1L;
        when(fileRepository.existsById(fileId)).thenReturn(true);

        // When
        fileService.deleteFile(fileId);

        // Then
        verify(fileRepository).existsById(fileId);
        verify(fileRepository).deleteById(fileId);
    }

    @Test
    void shouldThrowExceptionWhenDeletingNonExistentFile() {
        // Given
        Long fileId = 1L;
        when(fileRepository.existsById(fileId)).thenReturn(false);

        // When & Then
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> fileService.deleteFile(fileId));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        assertEquals("File not found", exception.getReason());
        verify(fileRepository).existsById(fileId);
        verify(fileRepository, never()).deleteById(fileId);
    }
}
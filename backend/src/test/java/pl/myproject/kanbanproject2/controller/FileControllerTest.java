package pl.myproject.kanbanproject2.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import pl.myproject.kanbanproject2.model.File;
import pl.myproject.kanbanproject2.service.FileService;

import java.io.IOException;

@ExtendWith(MockitoExtension.class)
public class FileControllerTest {

    private MockMvc mockMvc;

    @Mock
    private FileService fileService;

    @InjectMocks
    private FileController fileController;

    private ObjectMapper objectMapper;
    private File testFile;
    private MockMultipartFile mockMultipartFile;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(fileController).build();
        objectMapper = new ObjectMapper();

        // Create test file entity
        byte[] content = "test content".getBytes();
        testFile = new File("test.txt", "text/plain", content);
        testFile.setId(1L);

        // Create mock multipart file for upload tests
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
    void getFileShouldReturnFileContent() throws Exception {
        // given
        Mockito.when(fileService.getFile(1L)).thenReturn(testFile);

        // when
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.get("/files/1"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.header().string(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"test.txt\""))
                .andExpect(MockMvcResultMatchers.content().contentType("text/plain"))
                .andReturn();

        // then
        byte[] responseContent = result.getResponse().getContentAsByteArray();
        Assertions.assertArrayEquals(testFile.getData(), responseContent);

        Mockito.verify(fileService).getFile(1L);
    }



    @Test
    void deleteFileShouldHandleFileNotFound() throws Exception {
        // given
        Mockito.doThrow(new RuntimeException("File not found")).when(fileService).deleteFile(1L);

        // when & then
        mockMvc.perform(MockMvcRequestBuilders.delete("/files/1"))
                .andExpect(MockMvcResultMatchers.status().isNotFound())
                .andExpect(MockMvcResultMatchers.content().string("Plik nie znaleziony"));

        Mockito.verify(fileService).deleteFile(1L);
    }
}
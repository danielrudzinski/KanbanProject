package pl.myproject.kanbanproject2.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @InjectMocks
    private EmailService emailService;

    @Mock
    private JavaMailSender emailSender;

    @Mock
    private MimeMessage mimeMessage;

    @Test
    void shouldSendVerificationEmailSuccessfully() throws MessagingException {
        // Given
        String to = "test@example.com";
        String subject = "Test Subject";
        String text = "Test Content";

        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);

        // When
        emailService.sendVerificationEmail(to, subject, text);

        // Then
        verify(emailSender).createMimeMessage();
        verify(emailSender).send(mimeMessage);
    }

    @Test
    void shouldThrowRuntimeExceptionWhenEmailSendingFails() {
        // Given
        String to = "test@example.com";
        String subject = "Test Subject";
        String text = "Test Content";

        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("Failed to send email")).when(emailSender).send(mimeMessage);

        // When & Then
        assertThrows(RuntimeException.class,
                () -> emailService.sendVerificationEmail(to, subject, text));

        verify(emailSender).createMimeMessage();
        verify(emailSender).send(mimeMessage);
    }

    @Test
    void shouldCreateMimeMessageWhenSendingEmail() throws MessagingException {
        // Given
        String to = "test@example.com";
        String subject = "Test Subject";
        String text = "Test Content";

        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);

        // When
        emailService.sendVerificationEmail(to, subject, text);

        // Then
        verify(emailSender, times(1)).createMimeMessage();
    }

    @Test
    void shouldThrowExceptionForNullToAddress() {
        // Given
        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);

        // When & Then
        assertThrows(IllegalArgumentException.class,
                () -> emailService.sendVerificationEmail(null, "subject", "text"));

        verify(emailSender).createMimeMessage();
    }

    @Test
    void shouldThrowExceptionForEmptyToAddress() {
        // Given
        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);

        // When & Then
        assertThrows(Exception.class,
                () -> emailService.sendVerificationEmail("", "subject", "text"));

        verify(emailSender).createMimeMessage();
    }


    @Test
    void shouldSendEmailWithEmptySubjectAndText() throws MessagingException {
        // Given
        String to = "test@example.com";
        String subject = "";
        String text = "";

        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);

        // When
        emailService.sendVerificationEmail(to, subject, text);

        // Then
        verify(emailSender).createMimeMessage();
        verify(emailSender).send(mimeMessage);
    }

    @Test
    void shouldHandleValidEmailAddress() throws MessagingException {
        // Given
        String to = "user.name+tag@example.com";
        String subject = "Valid Email Test";
        String text = "<h1>HTML Content</h1>";

        when(emailSender.createMimeMessage()).thenReturn(mimeMessage);

        // When
        emailService.sendVerificationEmail(to, subject, text);

        // Then
        verify(emailSender).createMimeMessage();
        verify(emailSender).send(mimeMessage);
    }
}
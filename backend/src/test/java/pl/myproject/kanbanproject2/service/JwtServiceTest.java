package pl.myproject.kanbanproject2.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @InjectMocks
    private JwtService jwtService;

    @Mock
    private UserDetails userDetails;

    private String secretKey = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private long jwtExpiration = 86400000L; // 24 hours

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtService, "secretKey", secretKey);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", jwtExpiration);
    }

    @Test
    void shouldExtractUsernameFromToken() {
        // Given
        when(userDetails.getUsername()).thenReturn("testuser");
        String token = jwtService.generateToken(userDetails);

        // When
        String extractedUsername = jwtService.extractUsername(token);

        // Then
        assertEquals("testuser", extractedUsername);
    }

    @Test
    void shouldGenerateTokenWithUserDetails() {
        // Given
        when(userDetails.getUsername()).thenReturn("testuser");

        // When
        String token = jwtService.generateToken(userDetails);

        // Then
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void shouldGenerateTokenWithExtraClaims() {
        // Given
        when(userDetails.getUsername()).thenReturn("testuser");
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", "USER");

        // When
        String token = jwtService.generateToken(extraClaims, userDetails);

        // Then
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void shouldReturnExpirationTime() {
        // When
        long expiration = jwtService.getExpirationTime();

        // Then
        assertEquals(jwtExpiration, expiration);
    }

    @Test
    void shouldValidateTokenWhenValid() {
        // Given
        when(userDetails.getUsername()).thenReturn("testuser");
        String token = jwtService.generateToken(userDetails);

        // When
        boolean isValid = jwtService.isTokenValid(token, userDetails);

        // Then
        assertTrue(isValid);
    }

    @Test
    void shouldNotValidateTokenWhenUsernameDoesNotMatch() {
        // Given
        when(userDetails.getUsername()).thenReturn("testuser");
        String token = jwtService.generateToken(userDetails);

        UserDetails otherUser = mock(UserDetails.class);
        when(otherUser.getUsername()).thenReturn("otheruser");

        // When
        boolean isValid = jwtService.isTokenValid(token, otherUser);

        // Then
        assertFalse(isValid);
    }

    @Test
    void shouldExtractClaimFromToken() {
        // Given
        when(userDetails.getUsername()).thenReturn("testuser");
        String token = jwtService.generateToken(userDetails);

        // When
        Date expiration = jwtService.extractClaim(token, Claims::getExpiration);

        // Then
        assertNotNull(expiration);
        assertTrue(expiration.after(new Date()));
    }

    @Test
    void shouldNotValidateExpiredToken() throws InterruptedException {
        // Given
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 1L); // 1ms expiration
        when(userDetails.getUsername()).thenReturn("testuser");
        String token = jwtService.generateToken(userDetails);

        Thread.sleep(10); // Wait for token to expire

        // When & Then
        // ExpiredJwtException should be thrown when trying to validate expired token
        assertThrows(io.jsonwebtoken.ExpiredJwtException.class,
                () -> jwtService.isTokenValid(token, userDetails));
    }
}
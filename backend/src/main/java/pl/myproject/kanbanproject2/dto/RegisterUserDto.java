package pl.myproject.kanbanproject2.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import lombok.Getter;
import lombok.Setter;

import jakarta.validation.Valid;

@Getter @Setter
public class RegisterUserDto {
    private String email;
    private String password;
    private String username;

    // New: legacy flat field (frontend may send this)
    private String captchaToken;

    @Valid
    private CaptchaDto captcha;

    // Validation: require either nested captcha or legacy captchaToken
    @AssertTrue(message = "captcha or captchaToken must be provided")
    public boolean isCaptchaPresent() {
        boolean nested = captcha != null && captcha.getToken() != null && !captcha.getToken().isBlank();
        boolean flat = captchaToken != null && !captchaToken.isBlank();
        return nested || flat;
    }

    // Helper to return the token from either shape
    public String getCaptchaToken() {
        if (captcha != null && captcha.getToken() != null && !captcha.getToken().isBlank()) {
            return captcha.getToken();
        }
        return captchaToken;
    }
}
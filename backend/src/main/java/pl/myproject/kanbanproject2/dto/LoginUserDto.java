package pl.myproject.kanbanproject2.dto;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
public class LoginUserDto {
    private String email;
    private String password;
    @NotBlank
    private String captchaToken;
}
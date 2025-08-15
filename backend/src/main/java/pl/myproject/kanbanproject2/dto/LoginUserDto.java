package pl.myproject.kanbanproject2.dto;

import lombok.Getter;
import lombok.Setter;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

@Getter @Setter
public class LoginUserDto {
    private String email;
    private String password;

    @NotNull
    @Valid
    private CaptchaDto captcha;
}